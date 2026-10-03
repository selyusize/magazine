import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { syncInventoryForVariantsWorkflow } from "../sync-inventory-for-variants/workflow";
import type { UpsertSupplierOffersCommand } from "./command";
import type { UpsertedSupplierOffersDTO } from "./dto";
import { saveSupplierOffersStep } from "./step/save-supplier-offers";

/**
 * Предложения пачкой без событий на каждое (подписчик `supplier-offer-inventory` пересчитывал бы остатки по одному):
 * остатки затронутых вариантов пересчитываются здесь же одним вызовом.
 */
export const upsertSupplierOffersWorkflow = createWorkflow(
  "upsert-supplier-offers",
  (command: UpsertSupplierOffersCommand) => {
    const saved = saveSupplierOffersStep(command);
    syncInventoryForVariantsWorkflow.runAsStep({
      input: transform(saved, (saved) => ({ variant_ids: saved.variant_ids })),
    });
    return new WorkflowResponse(
      transform(saved, (saved): UpsertedSupplierOffersDTO => ({ created: saved.created, updated: saved.updated })),
    );
  },
);
