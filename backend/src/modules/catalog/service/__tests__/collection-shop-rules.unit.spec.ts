import { MedusaError } from "@medusajs/framework/utils";

import {
  type CollectionShopCandidate,
  collectionShopError,
  collectionShopRefs,
  findCollectionShopProblem,
  foreignCollectionProducts,
} from "../collection-shop-rules";

const candidate = (patch: Partial<CollectionShopCandidate> = {}): CollectionShopCandidate => ({
  id: "pcol_1",
  title: "Лето",
  shop_id: null,
  product_shop_ids: [],
  ...patch,
});

describe("findCollectionShopProblem", () => {
  it.each<[string, Partial<CollectionShopCandidate>, string | null]>([
    ["новая пустая коллекция", {}, null],
    ["уже этого магазина", { shop_id: "shop_a" }, null],
    ["товары этого магазина", { product_shop_ids: ["shop_a", "shop_a"] }, null],
    ["уже другого магазина", { shop_id: "shop_b" }, "other_shop"],
    ["товар другого магазина", { product_shop_ids: ["shop_a", "shop_b"] }, "foreign_products"],
    ["товар без магазина — чужой", { product_shop_ids: [null] }, "foreign_products"],
  ])("%s", (_name, patch, expected) => {
    expect(findCollectionShopProblem(candidate(patch), "shop_a")).toBe(expected);
  });
});

describe("collectionShopError", () => {
  it("400 с названием коллекции и причиной", () => {
    const error = collectionShopError([{ title: "Лето", problem: "other_shop" }]);
    expect(error.type).toBe(MedusaError.Types.INVALID_DATA);
    expect(error.message).toContain("«Лето» — уже в другом магазине");
  });
});

describe("foreignCollectionProducts", () => {
  it("коллекция магазина принимает только его товары, коллекция без магазина — любые", () => {
    const products = [
      { title: "Утюг", shop_id: "shop_a" },
      { title: "Чайник", shop_id: "shop_b" },
    ];
    expect(foreignCollectionProducts("shop_a", products)).toEqual(["Чайник"]);
    expect(foreignCollectionProducts(null, products)).toEqual([]);
  });
});

describe("collectionShopRefs", () => {
  const collections = [
    { id: "pcol_1", handle: "olisaːleto" },
    { id: "pcol_2", handle: "snowːzima" },
    { id: "pcol_3", handle: "olisaːosen" },
    { id: "pcol_4", handle: "bez-magazina" },
  ];

  it("additional_data.shop_id — для всех коллекций", () => {
    expect(collectionShopRefs(collections.slice(0, 2), { shop_id: "shop_a" })).toEqual([
      { shop: { id: "shop_a" }, collection_ids: ["pcol_1", "pcol_2"] },
    ]);
  });

  it("иначе — по префиксу handle, без префикса — без магазина", () => {
    expect(collectionShopRefs(collections, undefined)).toEqual([
      { shop: { slug: "olisa" }, collection_ids: ["pcol_1", "pcol_3"] },
      { shop: { slug: "snow" }, collection_ids: ["pcol_2"] },
    ]);
  });
});
