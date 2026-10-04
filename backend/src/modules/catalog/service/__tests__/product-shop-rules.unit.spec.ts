import { MedusaError } from "@medusajs/framework/utils";

import { findProductShopProblems, type ProductShopCandidate, productShopError } from "../product-shop-rules";

const candidate = (patch: Partial<ProductShopCandidate> = {}): ProductShopCandidate => ({
  channel_shop_ids: ["shop_a"],
  shop_id: "shop_a",
  brand_shop_id: null,
  main_category_shop_id: null,
  category_shop_ids: [],
  attribute_shop_ids: [],
  collection_shop_id: null,
  ...patch,
});

describe("findProductShopProblems", () => {
  it.each<[string, Partial<ProductShopCandidate>, string[]]>([
    ["один канал магазина, без справочников", {}, []],
    ["всё из своего магазина", { brand_shop_id: "shop_a", main_category_shop_id: "shop_a", attribute_shop_ids: ["shop_a"] }, []],
    ["без канала", { channel_shop_ids: [], shop_id: null }, ["no_shop"]],
    ["канал без магазина", { channel_shop_ids: [null], shop_id: null }, ["no_shop"]],
    ["два канала", { channel_shop_ids: ["shop_a", "shop_b"], shop_id: null }, ["no_shop"]],
    ["без магазина справочники не сравниваются", { channel_shop_ids: [], shop_id: null, brand_shop_id: "shop_b" }, ["no_shop"]],
    ["чужой бренд", { brand_shop_id: "shop_b" }, ["foreign_brand"]],
    ["чужая основная категория", { main_category_shop_id: "shop_b" }, ["foreign_main_category"]],
    ["категория без магазина — чужая", { category_shop_ids: ["shop_a", null] }, ["foreign_categories"]],
    ["одна чужая характеристика", { attribute_shop_ids: ["shop_a", "shop_b"] }, ["foreign_attributes"]],
    ["коллекция своего магазина", { collection_shop_id: "shop_a" }, []],
    ["чужая коллекция", { collection_shop_id: "shop_b" }, ["foreign_collection"]],
    [
      "всё чужое — все нарушения по порядку",
      {
        brand_shop_id: "shop_b",
        main_category_shop_id: "shop_b",
        category_shop_ids: ["shop_b"],
        attribute_shop_ids: ["shop_b"],
        collection_shop_id: "shop_b",
      },
      ["foreign_brand", "foreign_main_category", "foreign_categories", "foreign_attributes", "foreign_collection"],
    ],
  ])("%s", (_name, patch, expected) => {
    expect(findProductShopProblems(candidate(patch))).toEqual(expected);
  });
});

describe("productShopError", () => {
  it("400 с товарами и нарушениями", () => {
    const error = productShopError([{ title: "Утюг", problems: ["foreign_brand", "foreign_attributes"] }]);
    expect(error.type).toBe(MedusaError.Types.INVALID_DATA);
    expect(error.message).toContain("«Утюг» — бренд из другого магазина, характеристики из другого магазина");
  });
});
