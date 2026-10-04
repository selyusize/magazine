import { MedusaError } from "@medusajs/framework/utils";

import { isRecord } from "@shared/query/narrow";
import { type ShopRef, shopRefOfHandle } from "@shared/shop/shop-ref";

/** Коллекция глазами правил — собирает фетчер `find-collection-shops-by-ids`. */
export type CollectionShopCandidate = {
  id: string;
  title: string;
  /** Магазин по связи `shop ↔ product_collection`; ещё не выбран — `null`. */
  shop_id: string | null;
  /** Магазины товаров коллекции; товар без магазина — `null`. */
  product_shop_ids: readonly (string | null)[];
};

export type CollectionShopProblem = "other_shop" | "foreign_products";

/**
 * Коллекция — в одном магазине (план, шаг 6): магазин выбирается один раз и не меняется, товары коллекции — из него.
 * `null` — коллекцию можно отдать магазину `shopId` (или она уже его).
 */
export function findCollectionShopProblem(
  candidate: CollectionShopCandidate,
  shopId: string,
): CollectionShopProblem | null {
  if (candidate.shop_id !== null && candidate.shop_id !== shopId) return "other_shop";
  if (candidate.product_shop_ids.some((productShopId) => productShopId !== shopId)) return "foreign_products";
  return null;
}

const MESSAGES: { [K in CollectionShopProblem]: string } = {
  other_shop: "уже в другом магазине — магазин коллекции не меняется",
  foreign_products: "в ней товары другого магазина",
};

/** 400 с перечнем коллекций — назначение магазина откатывается. */
export function collectionShopError(
  problems: readonly { title: string; problem: CollectionShopProblem }[],
): MedusaError {
  const lines = problems.map((problem) => `«${problem.title}» — ${MESSAGES[problem.problem]}`);
  return new MedusaError(MedusaError.Types.INVALID_DATA, `Коллекция: ${lines.join("; ")}`);
}

/**
 * Товары, которые кладут в коллекцию списком: у коллекции с магазином — только товары этого магазина. Коллекция без
 * магазина принимает любые — их проверит выбор магазина. Отдаёт названия чужих товаров.
 */
export function foreignCollectionProducts(
  collectionShopId: string | null,
  products: readonly { title: string; shop_id: string | null }[],
): string[] {
  if (collectionShopId === null) return [];
  return products.filter((product) => product.shop_id !== collectionShopId).map((product) => product.title);
}

/**
 * Магазин новых коллекций из хука `collectionsCreated`: `additional_data.shop_id` (API, скрипты) — для всех, иначе —
 * префикс handle каждой (`{slug}ː…`, импорт и сид). Без того и другого коллекция остаётся без магазина (дашборд
 * Medusa) — магазин выбирают в её карточке.
 */
export function collectionShopRefs(
  collections: readonly { id: string; handle: string | null }[],
  additionalData: unknown,
): { shop: ShopRef; collection_ids: string[] }[] {
  const explicit = isRecord(additionalData) ? additionalData.shop_id : undefined;
  if (typeof explicit === "string" && explicit)
    return collections.length ? [{ shop: { id: explicit }, collection_ids: collections.map((c) => c.id) }] : [];

  const bySlug = new Map<string, string[]>();
  for (const collection of collections) {
    const ref = shopRefOfHandle(collection.handle ?? "");
    if (ref && "slug" in ref) bySlug.set(ref.slug, [...(bySlug.get(ref.slug) ?? []), collection.id]);
  }
  return [...bySlug].map(([slug, collection_ids]) => ({ shop: { slug }, collection_ids }));
}
