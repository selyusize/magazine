import { afterEach, describe, expect, it, vi } from "vitest";

import { sessionCookieOptions, tokenMaxAge } from "@shared/session/cookies";

import { fakeJwt, nowSec } from "../helpers/jwt";

describe("Параметры cookie сессии", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("httpOnly + sameSite=lax + path=/ — JS в браузере их не читает, возврат с оплаты работает", () => {
    expect(sessionCookieOptions(60)).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 });
  });

  it("secure включается в проде", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sessionCookieOptions(60).secure).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    expect(sessionCookieOptions(60).secure).toBe(false);
  });

  it("COOKIE_SECURE переопределяет поведение (прод-сборка по http)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COOKIE_SECURE", "false");
    expect(sessionCookieOptions(60).secure).toBe(false);
  });

  it("cookie с JWT живёт ровно до истечения токена", () => {
    const maxAge = tokenMaxAge(fakeJwt({ iat: nowSec(), exp: nowSec() + 3600 }));
    expect(maxAge).toBeGreaterThan(3590);
    expect(maxAge).toBeLessThanOrEqual(3600);
  });

  it("без exp — запасной срок 7 дней; истёкший токен — 0", () => {
    expect(tokenMaxAge("not-a-jwt")).toBe(7 * 24 * 60 * 60);
    expect(tokenMaxAge(fakeJwt({ exp: nowSec() - 10 }))).toBe(0);
  });
});
