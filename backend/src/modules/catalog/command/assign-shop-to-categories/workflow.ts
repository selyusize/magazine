import type { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";

import { SHOP_MODULE } from "../../../shop";
import type { AssignShopToCategoriesCommand } from "./command";
import type { AssignedCategoryShopDTO } from "./dto";
import { planCategoryShopLinksStep } from "./step/plan-category-shop-links";

/** Категория в дереве магазина родителя: связь `shop ↔ product_category` (`src/links/shop-product-category.ts`). */
export const assignShopToCategoriesWorkflow = createWorkflow(
  "assign-shop-to-categories",
  (command: AssignShopToCategoriesCommand) => {
    const links = planCategoryShopLinksStep(command);
    createRemoteLinkStep(
      transform(links, (links): LinkDefinition[] =>
        links.map((link) => ({
          [SHOP_MODULE]: { shop_id: link.shop_id },
          [Modules.PRODUCT]: { product_category_id: link.category_id },
        })),
      ),
    );
    return new WorkflowResponse<AssignedCategoryShopDTO[]>(links);
  },
);
