import { afterEach, describe, expect, it, vi } from "vitest";

import { contentSecurityPolicy, createNonce } from "@shared/lib/csp";

const directive = (csp: string, name: string) => csp.split("; ").find((part) => part.startsWith(`${name} `));

describe("Content-Security-Policy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("nonce уникален для каждого запроса", () => {
    expect(createNonce()).not.toBe(createNonce());
  });

  it("скрипты — только с nonce, без unsafe-inline и unsafe-eval в проде", () => {
    vi.stubEnv("NODE_ENV", "production");
    const csp = contentSecurityPolicy("abc");
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("в dev разрешён eval и нет апгрейда до https", () => {
    vi.stubEnv("NODE_ENV", "development");
    const csp = contentSecurityPolicy("abc");
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("API Medusa разрешён для запросов и картинок", () => {
    const csp = contentSecurityPolicy("abc");
    const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000").origin;
    expect(directive(csp, "connect-src")).toContain(apiOrigin);
    expect(directive(csp, "img-src")).toContain(apiOrigin);
  });

  it("внешние источники добавляются из окружения", () => {
    vi.stubEnv("CSP_CONNECT_SRC", "https://mc.yandex.ru  wss://mc.yandex.ru");
    vi.stubEnv("CSP_FRAME_SRC", "https://yoomoney.ru");
    const csp = contentSecurityPolicy("abc");
    expect(directive(csp, "connect-src")).toMatch(/https:\/\/mc\.yandex\.ru wss:\/\/mc\.yandex\.ru$/);
    expect(directive(csp, "frame-src")).toBe("frame-src 'self' https://yoomoney.ru");
  });

  it("frame-ancestors: по умолчанию сайт и Вебвизор, переменная заменяет список", () => {
    expect(directive(contentSecurityPolicy("abc"), "frame-ancestors")).toContain("https://metrika.yandex.ru");
    vi.stubEnv("CSP_FRAME_ANCESTORS", "'none'");
    expect(directive(contentSecurityPolicy("abc"), "frame-ancestors")).toBe("frame-ancestors 'none'");
  });
});
