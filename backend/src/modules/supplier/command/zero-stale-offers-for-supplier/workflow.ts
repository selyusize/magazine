import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { syncInventoryForVariantsWorkflow } from "../sync-inventory-for-variants/workflow";
import type { ZeroStaleOffersForSupplierCommand } from "./command";
import { zeroStaleOffersStep } from "./step/zero-stale-offers";

/** Товар пропал из выгрузки — остаток 0 у предложения этого поставщика, карточка остаётся (план, 4.4.5). */
export const zeroStaleOffersForSupplierWorkflow = createWorkflow(
  "zero-stale-offers-for-supplier",
  (command: ZeroStaleOffersForSupplierCommand) => {
    const stale = zeroStaleOffersStep(command);
    syncInventoryForVariantsWorkflow.runAsStep({
      input: transform(stale, (stale) => ({ variant_ids: stale.variant_ids })),
    });
    return new WorkflowResponse(transform(stale, (stale) => ({ count: stale.count })));
  },
);
