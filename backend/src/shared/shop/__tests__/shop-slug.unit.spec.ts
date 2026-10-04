import { ShopSlugSchema } from "../shop-slug";

describe("ShopSlugSchema", () => {
  it.each(["olisa", "snow-shop", "shop2", "ab"])("принимает «%s»", (slug) => {
    expect(ShopSlugSchema.parse(slug)).toBe(slug);
  });

  it("обрезает пробелы", () => {
    expect(ShopSlugSchema.parse("  olisa ")).toBe("olisa");
  });

  it.each([
    ["двойной дефис", "olisa--b"],
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
