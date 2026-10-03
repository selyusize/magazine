import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { SyncEntityURLHandler } from "@domain/redirect/command/sync-entity-url/handler";

/** Смена handle → 301 со старого пути. Повторное событие безопасно: путь уже записан. */
export default async function redirectArticleURL({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(SyncEntityURLHandler)
    .handle({ entity_type: "article", entity_id: data.id });
}

export const config: SubscriberConfig = {
  event: ["article.created", "article.updated"],
};
