import type { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { dismissRemoteLinkStep } from "@medusajs/medusa/core-flows";

import { SHOP_MODULE } from "../../../shop";
import type { RemoveShopFromCategoriesCommand } from "./command";

/**
 * Снимает связи категорий с магазином — когда создание категорий откатывается после хука (категория внутри
 * чужого workflow, который упал позже). Шаг Medusa сам вернёт связи при собственном откате.
 */
export const removeShopFromCategoriesWorkflow = createWorkflow(
  "remove-shop-from-categories",
  (command: RemoveShopFromCategoriesCommand) => {
    dismissRemoteLinkStep(
      transform(command, (command): LinkDefinition[] =>
        command.links.map((link) => ({
          [SHOP_MODULE]: { shop_id: link.shop_id },
          [Modules.PRODUCT]: { product_category_id: link.category_id },
        })),
      ),
    );
    return new WorkflowResponse(undefined);
  },
);
