/** Магазин по publishable-ключу (Store API) или по id (заголовок `x-shop-id` в Admin API) — что-то одно. */
export type FindShopContextQuery =
  { publishable_key: string } | { shop_id: string };
