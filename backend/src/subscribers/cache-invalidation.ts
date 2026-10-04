import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { cacheInvalidationEvents } from "@container/common/cache";
import { Container } from "@container/index";
import type { JSONValue } from "@shared/contract/command";
import { InvalidateCachesByEventHandler } from "@domain/shop/command/invalidate-caches-by-event/handler";

/** Изменение сущности → сброс кэша бэкенда и ревалидация витрин её магазина по реестру `container/common/cache.ts`. */
export default async function cacheInvalidation({ event, container }: SubscriberArgs<JSONValue>) {
  await Container.from(container)
    .get(InvalidateCachesByEventHandler)
    .handle({ event: event.name, data: event.data });
}

export const config: SubscriberConfig = { event: cacheInvalidationEvents };
