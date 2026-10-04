import { isString } from "@shared/query/narrow";

/**
 * Таблица редиректов магазина изменилась — витрина перечитывает её (тег `redirects`, реестр
 * `src/container/common/cache.ts`). Данные — `[{ shop_id }]`, магазин без повторов.
 */
export const REDIRECT_UPDATED = "redirect.updated";

export const toRedirectEventData = (shopIds: readonly (string | null | undefined)[]): { shop_id: string }[] =>
  [...new Set(shopIds.filter(isString))].map((shop_id) => ({ shop_id }));
