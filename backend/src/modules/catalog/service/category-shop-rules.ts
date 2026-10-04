import { MedusaError } from "@medusajs/framework/utils";

/** Положение категории в деревьях магазинов — собирает фетчер `find-category-shops-by-ids`. */
export type CategoryShopCandidate = {
  id: string;
  name: string;
  has_parent: boolean;
  /** Магазин родителя; родителя нет или он ничей — `null`. */
  parent_shop_id: string | null;
  /** Магазин, корнем дерева которого служит категория. */
  root_of_shop_id: string | null;
  /** Магазин по связи `shop ↔ product_category`; ещё не связана — `null`. */
  shop_id: string | null;
};

/** Магазин, которому категория обязана принадлежать: родителя — или магазин, чей это корень. */
export const expectedCategoryShop = (candidate: CategoryShopCandidate): string | null =>
  candidate.has_parent ? candidate.parent_shop_id : candidate.root_of_shop_id;

export type CategoryShopProblem = "outside_shop_tree" | "foreign_tree";

/**
 * Категория — в дереве ровно одного магазина (план, шаг 4): новая наследует магазин родителя, перенос в чужое
 * дерево и в корень запрещён. `null` — всё в порядке.
 */
export function findCategoryShopProblem(candidate: CategoryShopCandidate): CategoryShopProblem | null {
  const expected = expectedCategoryShop(candidate);
  if (expected === null) return "outside_shop_tree";
  return candidate.shop_id === expected ? null : "foreign_tree";
}

const MESSAGES: { [K in CategoryShopProblem]: string } = {
  outside_shop_tree: "вне дерева магазина — выберите родительскую категорию в дереве своего магазина",
  foreign_tree: "нельзя перенести в дерево другого магазина",
};

/** 400 с перечнем категорий — workflow Medusa откатывает создание или перенос. */
export function categoryShopError(
  problems: readonly { name: string; problem: CategoryShopProblem }[],
): MedusaError {
  const lines = problems.map((problem) => `«${problem.name}» — ${MESSAGES[problem.problem]}`);
  return new MedusaError(MedusaError.Types.INVALID_DATA, `Категория: ${lines.join("; ")}`);
}
