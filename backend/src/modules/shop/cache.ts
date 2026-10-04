/**
 * Тег кэша бэкенда «магазины»: магазин по ключу или id, origin витрин для CORS. Сбрасывается по `shop.*`
 * (реестр — `src/container/common/cache.ts`).
 */
export const SHOP_CACHE_TAG = "shops";

/** Страховка на случай потерянного события; обновление — по событию, а не по времени. */
export const SHOP_CACHE_TTL = 60 * 60;
