import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { DeleteFilterPagesByCategoryIdHandler } from "@domain/filter-page/command/delete-filter-pages-by-category-id/handler";

/** Удалили категорию → удаляем её посадочные. Повторное событие безопасно: посадочных уже нет. */
export default async function filterPageProductCategoryDeleted({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(DeleteFilterPagesByCategoryIdHandler)
    .handle({ category_id: data.id });
}

export const config: SubscriberConfig = { event: "product-category.deleted" };
