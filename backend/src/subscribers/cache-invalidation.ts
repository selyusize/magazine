import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { cacheInvalidationEvents } from "@container/common/cache";
import { Container } from "@container/index";
import { CacheInvalidator } from "@shared/service/cache-invalidation/cache-invalidator";

/** Изменение сущности → сброс тегов кэша бэкенда по реестру `container/common/cache.ts`. */
export default async function cacheInvalidation({
  event,
  container,
}: SubscriberArgs<unknown>) {
  await Container.from(container)
    .get(CacheInvalidator)
    .invalidate(event.name, event.data);
}

export const config: SubscriberConfig = { event: cacheInvalidationEvents };
