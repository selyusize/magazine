import {
  ShopSlugSchema,
  splitStoredHandle,
  toStoredHandle,
} from "../shop-slug";

describe("ShopSlugSchema", () => {
  it.each(["olisa", "snow-shop", "shop2", "ab"])("принимает «%s»", (slug) => {
    expect(ShopSlugSchema.parse(slug)).toBe(slug);
  });

  it("обрезает пробелы", () => {
    expect(ShopSlugSchema.parse("  olisa ")).toBe("olisa");
  });

  it.each([
    ["двойной дефис — разделитель префикса handle", "olisa--b"],
    ["заглавные", "Olisa"],
    ["кириллица", "олиса"],
    ["дефис по краям", "-olisa"],
    ["подчёркивание", "olisa_shop"],
    ["один символ", "o"],
    ["длиннее 32", "a".repeat(33)],
  ])("отклоняет: %s", (_reason, slug) => {
    expect(ShopSlugSchema.safeParse(slug).success).toBe(false);
  });
});

describe("toStoredHandle", () => {
  it("добавляет префикс магазина через двойной дефис", () => {
    expect(toStoredHandle({ shop: "olisa", handle: "utyug-philips" })).toBe(
      "olisa--utyug-philips",
    );
  });
});

describe("splitStoredHandle", () => {
  it("отделяет магазин от slug", () => {
    expect(splitStoredHandle("olisa--utyug-philips")).toEqual({
      shop: "olisa",
      handle: "utyug-philips",
    });
  });

  it("slug после префикса может быть не slug — его исправит синхронизация адреса", () => {
    expect(splitStoredHandle("olisa--Утюг")).toEqual({
      shop: "olisa",
      handle: "Утюг",
    });
  });

  it.each(["utyug-philips", "--utyug", "Olisa--utyug", "o--utyug", "Утюг"])(
    "без префикса магазина: «%s»",
    (stored) => {
      expect(splitStoredHandle(stored)).toEqual({ shop: null, handle: stored });
    },
  );

  it("обратна toStoredHandle", () => {
    expect(
      splitStoredHandle(
        toStoredHandle({ shop: "snow-shop", handle: "catalog" }),
      ),
    ).toEqual({
      shop: "snow-shop",
      handle: "catalog",
    });
  });
});
