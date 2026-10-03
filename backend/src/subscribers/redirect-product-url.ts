import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { SyncEntityURLHandler } from "@domain/redirect/command/sync-entity-url/handler";

/** Handle → slug, смена handle → 301 со старого пути. Повторное событие безопасно: путь уже записан. */
export default async function redirectProductURL({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(SyncEntityURLHandler)
    .handle({ entity_type: "product", entity_id: data.id });
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
};
