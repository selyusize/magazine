import type { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { dismissRemoteLinkStep } from "@medusajs/medusa/core-flows";

import { SHOP_MODULE } from "../../../shop";
import type { RemoveShopFromCollectionsCommand } from "./command";

/** Снимает связи коллекций с магазином — когда создание коллекций откатывается после хука. */
export const removeShopFromCollectionsWorkflow = createWorkflow(
  "remove-shop-from-collections",
  (command: RemoveShopFromCollectionsCommand) => {
    dismissRemoteLinkStep(
      transform(command, (command): LinkDefinition[] =>
        command.links.map((link) => ({
          [SHOP_MODULE]: { shop_id: link.shop_id },
          [Modules.PRODUCT]: { product_collection_id: link.collection_id },
        })),
      ),
    );
    return new WorkflowResponse(undefined);
  },
);
