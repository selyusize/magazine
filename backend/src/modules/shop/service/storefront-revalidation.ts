/** Пачку пора проверить и отправить: событие с задержкой (`delay`) — таймер дебаунса и повторов без своих очередей. */
export const STOREFRONT_REVALIDATION_QUEUED = "storefront_revalidation.queued";

/** Очередь пачек одного магазина: слияние новых тегов и захват пачки на отправку не пересекаются. */
export const revalidationLockKey = (shopId: string): string => `storefront-revalidation:${shopId}`;

/** Пачки магазинов без повторов магазина: теги одного магазина — в одну пачку. */
export function groupBatchesByShop(batches: readonly { shop_id: string; tags: readonly string[] }[]): {
  shop_id: string;
  tags: string[];
}[] {
  const byShop = new Map<string, Set<string>>();
  for (const batch of batches) {
    const tags = byShop.get(batch.shop_id) ?? new Set<string>();
    batch.tags.forEach((tag) => tags.add(tag));
    byShop.set(batch.shop_id, tags);
  }
  return [...byShop].flatMap(([shop_id, tags]) => (tags.size ? [{ shop_id, tags: [...tags].sort() }] : []));
}
