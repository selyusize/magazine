import { ALL_STOREFRONT_TAGS, entityTag, mergeStorefrontTags } from "../storefront-tags";

describe("mergeStorefrontTags", () => {
  it("объединяет без повторов и сортирует", () => {
    expect(mergeStorefrontTags(["products", "product:a"], ["product:a", "brand:x", "brands"], 10)).toEqual([
      "brand:x",
      "brands",
      "product:a",
      "products",
    ]);
  });

  it("больше предела тегов сущностей — они заменяются групповыми", () => {
    const products = Array.from({ length: 5 }, (_, index) => entityTag("product", `p${index}`));
    expect(mergeStorefrontTags(["sitemap", "category:x"], products, 3)).toEqual([
      "categories",
      "products",
      "sitemap",
    ]);
  });

  it("предел ровно — теги сущностей остаются", () => {
    expect(mergeStorefrontTags([], ["product:a", "product:b"], 2)).toEqual(["product:a", "product:b"]);
  });

  it("тег неизвестной сущности при схлопывании остаётся как есть", () => {
    expect(mergeStorefrontTags([], ["product:a", "product:b", "custom:x"], 1)).toEqual(["custom:x", "products"]);
  });

  it("filter-page схлопывается в filter-pages", () => {
    expect(mergeStorefrontTags([], ["filter-page:c/a", "filter-page:c/b"], 1)).toEqual(["filter-pages"]);
  });
});

describe("ALL_STOREFRONT_TAGS", () => {
  it("только групповые теги — «обновить витрину целиком»", () => {
    expect(ALL_STOREFRONT_TAGS.every((tag) => !tag.includes(":"))).toBe(true);
    expect(ALL_STOREFRONT_TAGS).toEqual(expect.arrayContaining(["products", "redirects", "shop", "sitemap"]));
  });
});
