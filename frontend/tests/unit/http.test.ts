import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, http } from "@shared/api/http";

type Captured = { url: string; init: RequestInit };

function mockFetch(status: number, body: unknown) {
  const calls: Captured[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    }),
  );
  return calls;
}

describe("http: транспорт до Medusa с маппингом имён", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("ответ приходит на фронт в camelCase", async () => {
    mockFetch(200, { cart: { id: "c1", customer_id: "cus_1", items: [{ product_id: "p1" }] } });
    await expect(http("/store/carts/c1")).resolves.toEqual({
      cart: { id: "c1", customerId: "cus_1", items: [{ productId: "p1" }] },
    });
  });

  it("тело запроса уходит на бэкенд в snake_case", async () => {
    const calls = mockFetch(200, {});
    await http("/store/carts/c1/line-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: "v1", quantity: 1, metadata: { engraving_text: "Ivan" } }),
    });
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      variant_id: "v1",
      quantity: 1,
      metadata: { engraving_text: "Ivan" },
    });
  });

  it("query-параметры уходят в snake_case, значения не меняются", async () => {
    const calls = mockFetch(200, {});
    await http("/store/products?regionId=reg_1&fields=*variants.calculated_price&limit=10");
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe("/store/products");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      region_id: "reg_1",
      fields: "*variants.calculated_price",
      limit: "10",
    });
  });

  it("каждый запрос несёт publishable key; свой заголовок не перезаписывается", async () => {
    const calls = mockFetch(200, {});
    await http("/store/regions");
    await http("/store/regions", { headers: { "x-publishable-api-key": "pk_custom" } });
    expect(new Headers(calls[0]!.init.headers).get("x-publishable-api-key")).toBe(
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
    );
    expect(new Headers(calls[1]!.init.headers).get("x-publishable-api-key")).toBe("pk_custom");
  });

  it("ошибка бэкенда → ApiError со статусом и телом (тоже в camelCase)", async () => {
    mockFetch(400, { type: "invalid_data", message: "Bad", error_code: "x" });
    const error = await http("/store/carts").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).body).toEqual({ type: "invalid_data", message: "Bad", errorCode: "x" });
  });
});
