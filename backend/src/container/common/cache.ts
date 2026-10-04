import type { ICachingModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import { define } from "@shared/container";
import {
  CacheInvalidator,
  type CacheInvalidationRule,
} from "@shared/service/cache-invalidation/cache-invalidator";
import { SHOP_CACHE_TAG } from "@domain/shop/cache";

/**
 * Реестр инвалидации: событие изменения → теги кэша бэкенда. Новый кэш (`cached(..., tags)`) регистрирует здесь
 * свои события — одна строка на событие. Шаг 7 плана добавит теги витрины и магазин(ы).
 */
export const cacheInvalidationRules: CacheInvalidationRule[] = [
  { event: "shop.created", tags: () => [SHOP_CACHE_TAG] },
  { event: "shop.updated", tags: () => [SHOP_CACHE_TAG] },
];

/** События реестра — на них подписан `src/subscribers/cache-invalidation.ts`. */
export const cacheInvalidationEvents = [
  ...new Set(cacheInvalidationRules.map((rule) => rule.event)),
];

export default [
  define(
    CacheInvalidator,
    ({ container }) =>
      new CacheInvalidator(
        cacheInvalidationRules,
        container.resolve<ICachingModuleService | undefined>(Modules.CACHING, {
          allowUnregistered: true,
        }),
        container.resolve(ContainerRegistrationKeys.LOGGER),
      ),
  ),
];
