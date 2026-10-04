import { recordOf, text } from "@shared/query/narrow";

import type { EntityShopRef } from "../service/path";

type Query = { graph: (config: Record<string, unknown>) => Promise<{ data: unknown[] }> };

/** Магазин сущности: id — для таблиц редиректов, slug — для префикса handle. */
export type EntityShop = { id: string; slug: string };

/**
 * Для шагов модуля, только чтение: магазин по ссылке из `URL_ENTITIES[type].shopOf` (id или slug) — с обоими
 * полями. Нет ссылки или такого магазина — `null`.
 */
export async function findEntityShop(query: Query, ref: EntityShopRef): Promise<EntityShop | null> {
  if (!ref) return null;
  const { data } = await query.graph({ entity: "shop", fields: ["id", "slug"], filters: ref });
  const shop = recordOf(data[0]);
  return text(shop.id) ? { id: text(shop.id), slug: text(shop.slug) } : null;
}
