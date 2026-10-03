import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { syncInventoryForVariantsWorkflow } from "../sync-inventory-for-variants/workflow";
import type { SyncInventoryForOffersCommand } from "./command";
import { findVariantIdsByOfferIdsStep } from "./step/find-variant-ids-by-offer-ids";

export const syncInventoryForOffersWorkflow = createWorkflow(
  "sync-inventory-for-offers",
  (command: SyncInventoryForOffersCommand) => {
    const variantIds = findVariantIdsByOfferIdsStep(command);
    syncInventoryForVariantsWorkflow.runAsStep({
      input: transform(variantIds, (variant_ids) => ({ variant_ids })),
    });
    return new WorkflowResponse(undefined);
  },
);
