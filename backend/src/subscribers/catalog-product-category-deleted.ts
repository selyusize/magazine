import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { ClearMainCategoryByCategoryIdHandler } from "@domain/catalog/command/clear-main-category-by-category-id/handler";

/** Удалили категорию → она больше ни у кого не основная. Повторное событие безопасно: строк уже нет. */
export default async function catalogProductCategoryDeleted({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(ClearMainCategoryByCategoryIdHandler)
    .handle({ category_id: data.id });
}

export const config: SubscriberConfig = { event: "product-category.deleted" };
