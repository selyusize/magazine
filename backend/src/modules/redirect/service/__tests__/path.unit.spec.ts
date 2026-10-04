import { findRedirectProblem, normalizePath, toEntityPath, URL_ENTITIES } from "../path";

describe("normalizePath", () => {
  it("убирает домен, query, якорь и завершающий слеш", () => {
    expect(normalizePath("https://olisa.ru/Products/x/?utm=1#top")).toBe(
      "/Products/x",
    );
    expect(normalizePath("  catalog//shoes/ ")).toBe("/catalog/shoes");
    expect(normalizePath("/")).toBe("/");
  });

  it("декодирует %-последовательности, кроме служебных символов и битых байтов", () => {
    expect(
      normalizePath(
        "/products/%D1%84%D1%83%D1%82%D0%B1%D0%BE%D0%BB%D0%BA%D0%B0",
      ),
    ).toBe("/products/футболка");
    expect(normalizePath("/a%2Fb")).toBe("/a%2Fb");
    expect(normalizePath("/bad%E0%A4%A")).toBe("/bad%E0%A4%A");
  });

  it("строит путь страницы сущности как витрина", () => {
    const row = (handle: string) => ({ id: "x", handle });
    expect(toEntityPath("product", row("futbolka"))).toBe("/products/futbolka");
    expect(toEntityPath("product_category", row("obuv"))).toBe("/catalog/obuv");
    expect(toEntityPath("product_collection", row("leto"))).toBe(
      "/collections/leto",
    );
    expect(toEntityPath("brand", row("nike"))).toBe("/brands/nike");
    expect(toEntityPath("article", row("kak-vybrat"))).toBe("/blog/kak-vybrat");
  });

  it("посадочная — внутри своей категории, без категории страницы нет", () => {
    expect(
      toEntityPath("filter_page", {
        id: "x",
        handle: "nike",
        product_category: { handle: "krossovki" },
      }),
    ).toBe("/catalog/krossovki/nike");
    expect(
      toEntityPath("filter_page", {
        id: "x",
        handle: "nike",
        product_category: null,
      }),
    ).toBeNull();
  });

  it("путь — с handle витрины, без префикса магазина", () => {
    expect(toEntityPath("product", { id: "x", handle: "olisaːutyug-philips" })).toBe("/products/utyug-philips");
    expect(
      toEntityPath("filter_page", { id: "x", handle: "nike", product_category: { handle: "olisaːkrossovki" } }),
    ).toBe("/catalog/krossovki/nike");
  });
});

describe("URL_ENTITIES.shopOf", () => {
  it("товар — магазин единственного канала, в двух каналах — ничей", () => {
    const channel = (id: string) => ({ id: `sc_${id}`, shop: { id } });
    expect(URL_ENTITIES.product.shopOf({ id: "p", sales_channels: [channel("shop_a")] })).toEqual({ id: "shop_a" });
    expect(
      URL_ENTITIES.product.shopOf({ id: "p", sales_channels: [channel("shop_a"), channel("shop_b")] }),
    ).toBeNull();
  });

  it("категория — по связи, свои сущности — по shop_id", () => {
    expect(URL_ENTITIES.product_category.shopOf({ id: "c", shop: { id: "shop_a" } })).toEqual({ id: "shop_a" });
    expect(URL_ENTITIES.brand.shopOf({ id: "b", shop_id: "shop_a" })).toEqual({ id: "shop_a" });
    expect(URL_ENTITIES.article.shopOf({ id: "a" })).toBeNull();
  });

  it("коллекция — по связи с магазином, без связи — ничья (префикс handle не в счёт)", () => {
    expect(URL_ENTITIES.product_collection.shopOf({ id: "c", handle: "leto", shop: { id: "shop_a" } })).toEqual({
      id: "shop_a",
    });
    expect(URL_ENTITIES.product_collection.shopOf({ id: "c", handle: "olisaːleto" })).toBeNull();
  });
});
