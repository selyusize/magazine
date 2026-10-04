import { MedusaError } from "@medusajs/framework/utils";

/** Что известно о магазинах товара и его справочных данных — собирает фетчер `find-shop-problems-by-product-ids`. */
export type ProductShopCandidate = {
  /** Магазины каналов товара; канал без магазина — `null`. */
  channel_shop_ids: readonly (string | null)[];
  /** Магазин товара (ровно один канал магазина) или `null`. */
  shop_id: string | null;
  /** Магазин бренда; бренда нет — `null`. */
  brand_shop_id: string | null;
  /** Магазин основной категории; категории нет — `null`. */
  main_category_shop_id: string | null;
  /** Магазины категорий товара (`product.categories`). */
  category_shop_ids: readonly (string | null)[];
  /** Магазины характеристик со значениями у товара и вариантов. */
  attribute_shop_ids: readonly string[];
  /** Магазин коллекции товара; коллекции нет или у неё ещё нет магазина — `null`. */
  collection_shop_id: string | null;
};

/**
 * Правила «товар живёт в одном магазине» (план, шаг 4): товар — ровно в одном канале магазина, бренд, основная
 * категория, категории, характеристики и коллекция — из этого магазина. Порядок — порядок сообщений; правило без магазина товара
 * проверяет только первое.
 */
const PRODUCT_SHOP_RULES = [
  {
    code: "no_shop",
    message: "не привязан к магазину — нужен ровно один канал продаж магазина",
    broken: (c: ProductShopCandidate) => c.channel_shop_ids.length !== 1 || c.shop_id === null,
  },
  {
    code: "foreign_brand",
    message: "бренд из другого магазина",
    broken: (c: ProductShopCandidate) => c.brand_shop_id !== null && c.brand_shop_id !== c.shop_id,
  },
  {
    code: "foreign_main_category",
    message: "основная категория из другого магазина",
    broken: (c: ProductShopCandidate) => c.main_category_shop_id !== null && c.main_category_shop_id !== c.shop_id,
  },
  {
    code: "foreign_categories",
    message: "категории из другого магазина",
    broken: (c: ProductShopCandidate) => c.category_shop_ids.some((shopId) => shopId !== c.shop_id),
  },
  {
    code: "foreign_attributes",
    message: "характеристики из другого магазина",
    broken: (c: ProductShopCandidate) => c.attribute_shop_ids.some((shopId) => shopId !== c.shop_id),
  },
  {
    code: "foreign_collection",
    message: "коллекция из другого магазина",
    broken: (c: ProductShopCandidate) => c.collection_shop_id !== null && c.collection_shop_id !== c.shop_id,
  },
] as const;

export type ProductShopProblem = (typeof PRODUCT_SHOP_RULES)[number]["code"];

/** Нарушенные правила товара; товар без магазина — только `no_shop`, остальное без магазина не сравнить. */
export function findProductShopProblems(candidate: ProductShopCandidate): ProductShopProblem[] {
  const broken = PRODUCT_SHOP_RULES.filter((rule) => rule.broken(candidate)).map((rule) => rule.code);
  return broken.includes("no_shop") ? ["no_shop"] : broken;
}

const messageOf = (code: ProductShopProblem): string =>
  PRODUCT_SHOP_RULES.find((rule) => rule.code === code)?.message ?? code;

/** Ошибка с перечнем товаров и нарушений — 400; workflow Medusa откатывает изменение. */
export function productShopError(
  problems: readonly { title: string; problems: readonly ProductShopProblem[] }[],
): MedusaError {
  const lines = problems.map((problem) => `«${problem.title}» — ${problem.problems.map(messageOf).join(", ")}`);
  return new MedusaError(MedusaError.Types.INVALID_DATA, `Товар не согласован с магазином: ${lines.join("; ")}`);
}
