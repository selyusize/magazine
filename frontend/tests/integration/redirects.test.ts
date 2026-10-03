/**
 * Редиректы в proxy.ts против живой Medusa: таблица из GET /store/redirects совпадает с контрактом клиента,
 * а у правил тот же вид пути, что строит витрина (сами правила проверяют тесты бэкенда).
 */
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { getRedirects } from "@shared/api";
import { normalizePath, resolveRedirect } from "@shared/redirects";

describe("Редиректы витрины (proxy)", () => {
  it("таблица загружается, пути правил уже нормализованы", async () => {
    const { redirects } = await getRedirects();
    for (const rule of redirects) {
      expect(normalizePath(rule.fromPath)).toBe(rule.fromPath);
      expect([301, 302, 410]).toContain(rule.code);
    }
  });

  it("путь без правила проходит дальше", async () => {
    const request = new NextRequest(`http://localhost:3000/no-such-redirect-${Date.now()}`);
    expect(await resolveRedirect(request)).toBeNull();
  });
});
