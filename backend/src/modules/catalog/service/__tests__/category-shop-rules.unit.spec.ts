import { MedusaError } from "@medusajs/framework/utils";

import {
  type CategoryShopCandidate,
  categoryShopError,
  expectedCategoryShop,
  findCategoryShopProblem,
} from "../category-shop-rules";

const category = (patch: Partial<CategoryShopCandidate> = {}): CategoryShopCandidate => ({
  id: "pcat_1",
  name: "Утюги",
  has_parent: true,
  parent_shop_id: "shop_a",
  root_of_shop_id: null,
  shop_id: "shop_a",
  ...patch,
});

describe("expectedCategoryShop", () => {
  it("магазин родителя, у корня — магазин этого корня", () => {
    expect(expectedCategoryShop(category())).toBe("shop_a");
    expect(expectedCategoryShop(category({ has_parent: false, parent_shop_id: null, root_of_shop_id: "shop_b" }))).toBe(
      "shop_b",
    );
    expect(expectedCategoryShop(category({ has_parent: false, parent_shop_id: null }))).toBeNull();
  });
});

describe("findCategoryShopProblem", () => {
  it.each<[string, Partial<CategoryShopCandidate>, string | null]>([
    ["в дереве своего магазина", {}, null],
    ["корень своего магазина", { has_parent: false, parent_shop_id: null, root_of_shop_id: "shop_a" }, null],
    ["перенесена под категорию другого магазина", { parent_shop_id: "shop_b" }, "foreign_tree"],
    ["вынесена в корень", { has_parent: false, parent_shop_id: null }, "outside_shop_tree"],
    ["родитель ничей", { parent_shop_id: null }, "outside_shop_tree"],
    ["не связана с магазином", { shop_id: null }, "foreign_tree"],
  ])("%s", (_name, patch, expected) => {
    expect(findCategoryShopProblem(category(patch))).toBe(expected);
  });
});

describe("categoryShopError", () => {
  it("400 с названием категории", () => {
    const error = categoryShopError([{ name: "Утюги", problem: "foreign_tree" }]);
    expect(error.type).toBe(MedusaError.Types.INVALID_DATA);
    expect(error.message).toContain("«Утюги» — нельзя перенести в дерево другого магазина");
  });
});
