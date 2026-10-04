import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { createCollectionsWorkflow } from "@medusajs/medusa/core-flows";

import { Container } from "@container/index";
import { AssignShopToCollectionsHandler } from "@domain/catalog/command/assign-shop-to-collections/handler";
import type { AssignedCollectionShopDTO } from "@domain/catalog/command/assign-shop-to-collections/dto";
import { RemoveShopFromCollectionsHandler } from "@domain/catalog/command/remove-shop-from-collections/handler";
import { collectionShopRefs } from "@domain/catalog/service/collection-shop-rules";

/**
 * Коллекция магазина (план, шаг 6): новая получает магазин из `additional_data.shop_id` или префикса handle. Без них
 * (дашборд Medusa) — без магазина, его выбирают в карточке коллекции. Откат создания снимает связи.
 */
createCollectionsWorkflow.hooks.collectionsCreated(
  async ({ collections, additional_data }, { container }) => {
    const handler = Container.from(container).get(AssignShopToCollectionsHandler);
    const links: AssignedCollectionShopDTO[] = [];
    for (const { shop, collection_ids } of collectionShopRefs(collections, additional_data))
      links.push(...(await handler.handle({ shop, collection_ids })));
    return new StepResponse(undefined, links);
  },
  async (links, { container }) => {
    if (!links?.length) return;
    await Container.from(container).get(RemoveShopFromCollectionsHandler).handle({ links });
  },
);
