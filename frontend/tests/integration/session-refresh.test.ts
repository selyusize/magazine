/**
 * Продление JWT в proxy.ts: пока покупатель ходит по сайту, токен обновляется
 * до истечения; истёкший токен удаляется.
 */
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { register } from "@features/auth";
import { getCustomersMe } from "@shared/api";
import { SESSION_COOKIE, refreshSession } from "@shared/session";
import { decodeJwt } from "@shared/session/jwt";

import { cookieJar } from "../helpers/cookie-jar";
import { uniqueEmail } from "../helpers/medusa";

async function customerToken() {
  const result = await register({ email: uniqueEmail("refresh"), password: "secret-password-123" });
  if (!result.ok) throw new Error(result.error.message);
  return cookieJar.value(SESSION_COOKIE.token)!;
}

function pageRequest(token?: string) {
  const request = new NextRequest("http://localhost:3000/catalog");
  if (token) request.cookies.set(SESSION_COOKIE.token, token);
  return request;
}

/** Сдвинуть «сейчас» на долю срока жизни токена (Medusa при этом проверяет токен по реальному времени). */
function travelThroughTokenLife(token: string, fraction: number) {
  const { iat, exp } = decodeJwt(token)!;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime((iat! + (exp! - iat!) * fraction) * 1000);
}

describe("Продление сессии (proxy)", () => {
  afterEach(() => vi.useRealTimers());

  it("гость: запрос проходит без изменений", async () => {
    const response = await refreshSession(pageRequest());
    expect(response.cookies.getAll()).toHaveLength(0);
  });

  it("свежий токен не трогается", async () => {
    const token = await customerToken();
    const response = await refreshSession(pageRequest(token));
    expect(response.cookies.get(SESSION_COOKIE.token)).toBeUndefined();
  });

  it("после половины срока жизни токен обновляется в Medusa и записывается в httpOnly-cookie", async () => {
    const token = await customerToken();
    // iat в секундах: без паузы Medusa выдаст байт-в-байт тот же токен
    await new Promise((resolve) => setTimeout(resolve, 1100));
    travelThroughTokenLife(token, 0.6);

    const request = pageRequest(token);
    const response = await refreshSession(request);
    const refreshed = response.cookies.get(SESSION_COOKIE.token);

    expect(refreshed?.value).toBeTruthy();
    expect(refreshed?.value).not.toBe(token);
    expect(refreshed).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    // RSC этого же запроса видят уже новый токен
    expect(request.cookies.get(SESSION_COOKIE.token)?.value).toBe(refreshed?.value);

    vi.useRealTimers();
    const { customer } = await getCustomersMe({}, { headers: { Authorization: `Bearer ${refreshed!.value}` } });
    expect(customer.email).toMatch(/^refresh\+/);
  });

  it("истёкший токен удаляется из cookie", async () => {
    const token = await customerToken();
    travelThroughTokenLife(token, 1.01);

    const request = pageRequest(token);
    const response = await refreshSession(request);

    const cookie = response.cookies.get(SESSION_COOKIE.token);
    expect(cookie?.value).toBe("");
    expect(request.cookies.has(SESSION_COOKIE.token)).toBe(false);
  });

  it("поддельный токен (Medusa отклоняет обновление) — запрос не падает", async () => {
    const token = await customerToken();
    const [header, , signature] = token.split(".");
    const { iat, exp } = decodeJwt(token)!;
    const forgedPayload = Buffer.from(JSON.stringify({ iat, exp, actor_id: "cus_forged" })).toString("base64url");
    const forged = `${header}.${forgedPayload}.${signature}`;
    travelThroughTokenLife(forged, 0.6);

    const response = await refreshSession(pageRequest(forged));
    expect(response.cookies.get(SESSION_COOKIE.token)).toBeUndefined();
  });
});
