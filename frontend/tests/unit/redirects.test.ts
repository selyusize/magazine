import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GetRedirects200 } from "@shared/api";
import { normalizePath } from "@shared/redirects/path";

const getRedirects = vi.fn<() => Promise<GetRedirects200>>();
vi.mock("@shared/api", () => ({ getRedirects: () => getRedirects() }));

const RULES: GetRedirects200 = {
  redirects: [
    { fromPath: "/products/old", toPath: "/products/new", code: 301 },
    { fromPath: "/sale", toPath: "/catalog/sale", code: 302 },
    { fromPath: "/products/gone", toPath: null, code: 410 },
    { fromPath: "/каталог", toPath: "/catalog", code: 301 },
  ],
};

/** Модуль заново на каждый тест: таблица кэшируется в памяти модуля. */
async function loadResolver() {
  vi.resetModules();
  return (await import("@shared/redirects/resolve")).resolveRedirect;
}

const request = (url: string, method = "GET") => new NextRequest(`http://localhost:3000${url}`, { method });

type Result = Awaited<ReturnType<Awaited<ReturnType<typeof loadResolver>>>>;
const redirectOf = (result: Result) => (result?.type === "redirect" ? result.response : null);

describe("normalizePath: тот же ключ, что у правил в Medusa", () => {
  it("убирает завершающий и двойные слеши, query и якорь", () => {
    expect(normalizePath("/products/old/")).toBe("/products/old");
    expect(normalizePath("//products//old")).toBe("/products/old");
    expect(normalizePath("/products/old?utm=1#top")).toBe("/products/old");
    expect(normalizePath("/")).toBe("/");
  });

  it("декодирует кириллицу, битые последовательности и закодированный слеш оставляет", () => {
    expect(normalizePath("/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3")).toBe("/каталог");
    expect(normalizePath("/a%2Fb")).toBe("/a%2Fb");
    expect(normalizePath("/bad%D0")).toBe("/bad%D0");
  });

  it("регистр не меняет", () => {
    expect(normalizePath("/Products/Old")).toBe("/Products/Old");
  });
});

describe("resolveRedirect: редиректы витрины в proxy", () => {
  beforeEach(() => {
    getRedirects.mockReset();
    getRedirects.mockResolvedValue(RULES);
  });
  afterEach(() => vi.useRealTimers());

  it("301 на новый адрес с сохранением query", async () => {
    const resolveRedirect = await loadResolver();
    const response = redirectOf(await resolveRedirect(request("/products/old/?utm_source=ya")));

    expect(response?.status).toBe(301);
    expect(response?.headers.get("location")).toBe("http://localhost:3000/products/new?utm_source=ya");
  });

  it("302 — временный редирект", async () => {
    const resolveRedirect = await loadResolver();
    const response = redirectOf(await resolveRedirect(request("/sale")));
    expect(response?.status).toBe(302);
    expect(response?.headers.get("location")).toBe("http://localhost:3000/catalog/sale");
  });

  it("кириллический путь в %-кодировке находит правило", async () => {
    const resolveRedirect = await loadResolver();
    const response = redirectOf(await resolveRedirect(request("/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3")));
    expect(response?.headers.get("location")).toBe("http://localhost:3000/catalog");
  });

  it("правило 410 — показать 404 магазина вместо редиректа", async () => {
    const resolveRedirect = await loadResolver();
    expect(await resolveRedirect(request("/products/gone"))).toEqual({ type: "gone" });
    expect(await resolveRedirect(request("/products/gone/", "HEAD"))).toEqual({ type: "gone" });
  });

  it("нет правила — запрос идёт дальше", async () => {
    const resolveRedirect = await loadResolver();
    expect(await resolveRedirect(request("/products/new"))).toBeNull();
  });

  it("POST (Server Action) не уводит и таблицу не грузит", async () => {
    const resolveRedirect = await loadResolver();
    expect(await resolveRedirect(request("/products/old", "POST"))).toBeNull();
    expect(getRedirects).not.toHaveBeenCalled();
  });

  it("таблица грузится один раз и обновляется в фоне после TTL", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const resolveRedirect = await loadResolver();
    const { REDIRECTS_TTL_MS } = await import("@shared/redirects/table");

    await Promise.all([resolveRedirect(request("/sale")), resolveRedirect(request("/products/old"))]);
    await resolveRedirect(request("/sale"));
    expect(getRedirects).toHaveBeenCalledTimes(1);

    getRedirects.mockResolvedValue({ redirects: [{ fromPath: "/sale", toPath: "/catalog/new-sale", code: 301 }] });
    vi.setSystemTime(Date.now() + REDIRECTS_TTL_MS + 1);

    // Устаревшая таблица отдаётся сразу, новая подтягивается в фоне
    const stale = redirectOf(await resolveRedirect(request("/sale")));
    expect(stale?.headers.get("location")).toBe("http://localhost:3000/catalog/sale");
    expect(getRedirects).toHaveBeenCalledTimes(2);

    await vi.waitFor(async () => {
      const fresh = redirectOf(await resolveRedirect(request("/sale")));
      expect(fresh?.headers.get("location")).toBe("http://localhost:3000/catalog/new-sale");
    });
  });

  it("Medusa недоступна — сайт работает без редиректов, повтор не на каждом запросе", async () => {
    getRedirects.mockRejectedValue(new Error("ECONNREFUSED"));
    const resolveRedirect = await loadResolver();

    expect(await resolveRedirect(request("/products/old"))).toBeNull();
    expect(await resolveRedirect(request("/products/old"))).toBeNull();
    expect(getRedirects).toHaveBeenCalledTimes(1);
  });

  it("Medusa упала после загрузки — работает прежняя таблица", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const resolveRedirect = await loadResolver();
    const { REDIRECTS_TTL_MS } = await import("@shared/redirects/table");
    await resolveRedirect(request("/sale"));

    getRedirects.mockRejectedValue(new Error("ECONNREFUSED"));
    vi.setSystemTime(Date.now() + REDIRECTS_TTL_MS + 1);
    await resolveRedirect(request("/sale"));
    await vi.waitFor(() => expect(getRedirects).toHaveBeenCalledTimes(2));

    const response = redirectOf(await resolveRedirect(request("/products/old")));
    expect(response?.status).toBe(301);
  });
});

describe("rewriteToNotFound: удалённая страница в proxy", () => {
  it("rewrite на путь без роута, заголовки запроса и cookie сессии сохраняются", async () => {
    const { NextResponse } = await import("next/server");
    const { rewriteToNotFound } = await import("@shared/redirects/resolve");

    const page = request("/products/gone");
    page.headers.set("x-nonce", "abc");
    const session = NextResponse.next({ request: page });
    session.cookies.set("_medusa_jwt", "fresh-token", { httpOnly: true });

    const response = rewriteToNotFound(page, session);

    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/_gone");
    expect(response.headers.get("x-middleware-request-x-nonce")).toBe("abc");
    expect(response.cookies.get("_medusa_jwt")?.value).toBe("fresh-token");
  });
});
