import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { syncInventoryForVariantsWorkflow } from "../sync-inventory-for-variants/workflow";
import type { SyncInventoryForSupplierCommand } from "./command";
import { findVariantIdsBySupplierIdStep } from "./step/find-variant-ids-by-supplier-id";

/** Все варианты поставщика одним пересчётом; разбивку на пачки добавит импорт (этап 4), когда их станут тысячи. */
export const syncInventoryForSupplierWorkflow = createWorkflow(
  "sync-inventory-for-supplier",
  (command: SyncInventoryForSupplierCommand) => {
    const variantIds = findVariantIdsBySupplierIdStep(command);
    syncInventoryForVariantsWorkflow.runAsStep({
      input: transform(variantIds, (variant_ids) => ({ variant_ids })),
    });
    return new WorkflowResponse(undefined);
  },
);
