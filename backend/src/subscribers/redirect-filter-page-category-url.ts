import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { SyncFilterPagePathsByCategoryIdHandler } from "@domain/redirect/command/sync-filter-page-paths-by-category-id/handler";

/** Смена handle категории → 301 со старых адресов её посадочных. Повторное событие безопасно. */
export default async function redirectFilterPageCategoryURL({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(SyncFilterPagePathsByCategoryIdHandler)
    .handle({ category_id: data.id });
}

export const config: SubscriberConfig = { event: "product-category.updated" };
