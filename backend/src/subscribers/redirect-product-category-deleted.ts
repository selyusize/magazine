import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { CloseEntityURLHandler } from "@domain/redirect/command/close-entity-url/handler";

/** Удаление → 410 с последнего и старых путей. Повторное событие безопасно: путь уже забыт. */
export default async function redirectProductCategoryDeleted({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(CloseEntityURLHandler)
    .handle({ entity_type: "product_category", entity_id: data.id });
}

export const config: SubscriberConfig = { event: "product-category.deleted" };
