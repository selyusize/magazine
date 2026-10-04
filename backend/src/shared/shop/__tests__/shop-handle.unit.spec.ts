import { isValidHandle } from "@medusajs/framework/utils";

import {
  splitStoredHandle,
  toPublicHandle,
  toPublicHandles,
  toShopHandle,
  toShopHandleParams,
  toStoredHandle,
  withShopHandleFilter,
} from "../shop-handle";

describe("toStoredHandle", () => {
  it("добавляет префикс магазина", () => {
    expect(toStoredHandle({ shop: "olisa", handle: "utyug-philips" })).toBe("olisaːutyug-philips");
  });

  it("handle с префиксом проходит проверку handle товара в Medusa", () => {
    expect(isValidHandle(toStoredHandle({ shop: "snow-shop", handle: "utyug-philips-2" }))).toBe(true);
  });
});

describe("splitStoredHandle", () => {
  it("отделяет магазин от slug", () => {
    expect(splitStoredHandle("olisaːutyug-philips")).toEqual({ shop: "olisa", handle: "utyug-philips" });
  });

  it("часть после префикса может быть не slug — её исправит синхронизация адреса", () => {
    expect(splitStoredHandle("olisaːУтюг")).toEqual({ shop: "olisa", handle: "Утюг" });
  });

  it.each(["utyug-philips", "ːutyug", "Olisaːutyug", "oːutyug", "Утюг", "olisa--utyug"])(
    "без префикса магазина: «%s»",
    (stored) => {
      expect(splitStoredHandle(stored)).toEqual({ shop: null, handle: stored });
    },
  );

  it("обратна toStoredHandle", () => {
    expect(splitStoredHandle(toStoredHandle({ shop: "snow-shop", handle: "catalog" }))).toEqual({
      shop: "snow-shop",
      handle: "catalog",
    });
  });
});

describe("toPublicHandle", () => {
  it.each([
    ["olisaːutyug-philips", "utyug-philips"],
    ["snow-shopːcatalog", "catalog"],
    ["utyug-philips", "utyug-philips"],
  ])("%s → %s", (stored, handle) => {
    expect(toPublicHandle(stored)).toBe(handle);
  });
});

describe("toShopHandle", () => {
  it("handle витрины получает префикс магазина", () => {
    expect(toShopHandle({ shop: "olisa", handle: "utyug-philips" })).toBe("olisaːutyug-philips");
  });

  it("уже с префиксом — не меняется", () => {
    expect(toShopHandle({ shop: "olisa", handle: "olisaːutyug" })).toBe("olisaːutyug");
    expect(toShopHandle({ shop: "olisa", handle: "snowːutyug" })).toBe("snowːutyug");
  });
});

describe("toPublicHandles", () => {
  it("снимает префикс с handle на любой глубине и не трогает остальное", () => {
    const body = {
      products: [
        {
          id: "prod_1",
          handle: "olisaːutyug",
          title: "olisaːне handle",
          categories: [{ handle: "olisaːbytovaya-tehnika", parent_category: { handle: "olisaːcatalog" } }],
        },
      ],
      cart: { items: [{ product_handle: "olisaːutyug", quantity: 1 }] },
      count: 1,
      next: null,
    };
    expect(toPublicHandles(body)).toEqual({
      products: [
        {
          id: "prod_1",
          handle: "utyug",
          title: "olisaːне handle",
          categories: [{ handle: "bytovaya-tehnika", parent_category: { handle: "catalog" } }],
        },
      ],
      cart: { items: [{ product_handle: "utyug", quantity: 1 }] },
      count: 1,
      next: null,
    });
    expect(body.products[0].handle).toBe("olisaːutyug");
  });

  it("экземпляры классов (даты, суммы) отдаёт как есть", () => {
    class Amount {
      constructor(readonly value: number) {}
      toJSON() {
        return this.value;
      }
    }
    const date = new Date("2026-10-04T00:00:00Z");
    const amount = new Amount(100);
    const result = toPublicHandles({ created_at: date, total: amount });
    expect(result).toEqual({ created_at: date, total: amount });
    expect(JSON.stringify(result)).toBe(JSON.stringify({ created_at: date, total: 100 }));
  });
});

describe("toShopHandleParams", () => {
  it("переводит строку и массив, остальное не трогает", () => {
    expect(
      toShopHandleParams({
        shop: "olisa",
        query: { handle: "utyug", limit: "1" },
        params: ["handle"],
      }),
    ).toEqual({ handle: "olisaːutyug" });
    expect(
      toShopHandleParams({ shop: "olisa", query: { handle: ["a", "olisaːb"] }, params: ["handle"] }),
    ).toEqual({ handle: ["olisaːa", "olisaːb"] });
    expect(toShopHandleParams({ shop: "olisa", query: { q: "x" }, params: ["handle"] })).toEqual({});
  });
});

describe("withShopHandleFilter", () => {
  it("добавляет префикс магазина через $and, фильтр клиента по handle остаётся", () => {
    const filters = { handle: "olisaːobuv", is_active: true, $and: [{ id: "pcat_1" }] };
    expect(withShopHandleFilter(filters, "olisa")).toEqual({
      handle: "olisaːobuv",
      is_active: true,
      $and: [{ id: "pcat_1" }, { handle: { $like: "olisaː%" } }],
    });
    expect(filters.$and).toHaveLength(1);
  });
});
