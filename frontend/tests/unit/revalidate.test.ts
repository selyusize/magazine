import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));

const invalidateRedirectRules = vi.fn(async () => {});
vi.mock("@shared/redirects", () => ({ invalidateRedirectRules: () => invalidateRedirectRules() }));

vi.mock("@shared/config", () => ({ env: { revalidateSecret: "s3cret" } }));

const { handleRevalidate, REVALIDATE_SECRET_HEADER } = await import("@shared/revalidate");

const webhook = (body: unknown, secret: string | null = "s3cret") =>
  new Request("http://localhost:3000/api/revalidate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret === null ? {} : { [REVALIDATE_SECRET_HEADER]: secret }),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/revalidate: вебхук ревалидации от бэкенда", () => {
  beforeEach(() => {
    revalidateTag.mockReset();
    invalidateRedirectRules.mockClear();
  });

  it("сбрасывает теги сразу (expire: 0), без повторов", async () => {
    const response = await handleRevalidate(webhook({ tags: ["products", "product:utyug", "products"] }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revalidated: ["products", "product:utyug"] });
    expect(revalidateTag.mock.calls).toEqual([
      ["products", { expire: 0 }],
      ["product:utyug", { expire: 0 }],
    ]);
    expect(invalidateRedirectRules).not.toHaveBeenCalled();
  });

  it("тег redirects — таблица редиректов proxy перечитывается", async () => {
    await handleRevalidate(webhook({ tags: ["redirects", "sitemap"] }));
    expect(invalidateRedirectRules).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["без секрета", null],
    ["чужой секрет", "other"],
    ["секрет другой длины", "s3cret-longer"],
  ])("%s — 401, кэш не трогается", async (_, secret) => {
    const response = await handleRevalidate(webhook({ tags: ["products"] }, secret));
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it.each([
    ["не JSON", "tags=products"],
    ["без тегов", { tags: [] }],
    ["тег не строка", { tags: [1] }],
    ["тег длиннее 256", { tags: ["x".repeat(257)] }],
  ])("%s — 400", async (_, body) => {
    const response = await handleRevalidate(webhook(body));
    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("пустой секрет витрины — вебхук выключен", () => {
  it("401 даже с пустым заголовком", async () => {
    vi.resetModules();
    vi.doMock("@shared/config", () => ({ env: { revalidateSecret: "" } }));
    const reloaded = await import("@shared/revalidate");
    const response = await reloaded.handleRevalidate(webhook({ tags: ["products"] }, ""));
    expect(response.status).toBe(401);
  });
});
