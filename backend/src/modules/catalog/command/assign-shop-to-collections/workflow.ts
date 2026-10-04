import type { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createRemoteLinkStep, emitEventStep } from "@medusajs/medusa/core-flows";

import { SHOP_MODULE } from "../../../shop";
import type { AssignShopToCollectionsCommand } from "./command";
import type { AssignedCollectionShopDTO } from "./dto";
import { planCollectionShopLinksStep } from "./step/plan-collection-shop-links";

/**
 * Коллекция в магазине: связь `shop ↔ product_collection` (`src/links/shop-product-collection.ts`) и событие
 * `product-collection.updated` — на него синхронизация адреса ставит префикс магазина в handle и запоминает путь.
 */
export const assignShopToCollectionsWorkflow = createWorkflow(
  "assign-shop-to-collections",
  (command: AssignShopToCollectionsCommand) => {
    const links = planCollectionShopLinksStep(command);
    createRemoteLinkStep(
      transform(links, (links): LinkDefinition[] =>
        links.map((link) => ({
          [SHOP_MODULE]: { shop_id: link.shop_id },
          [Modules.PRODUCT]: { product_collection_id: link.collection_id },
        })),
      ),
    );
    emitEventStep({
      eventName: "product-collection.updated",
      data: transform(links, (links) => links.map((link) => ({ id: link.collection_id }))),
    });
    return new WorkflowResponse<AssignedCollectionShopDTO[]>(links);
  },
);
