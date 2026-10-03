import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import type { SyncInventoryForSupplierCommand } from "../command";

/** Только чтение: варианты предложений поставщика, включая удалённые вместе с ним. */
export const findVariantIdsBySupplierIdStep = createStep(
  "find-variant-ids-by-supplier-id",
  async (command: SyncInventoryForSupplierCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data } = await query.graph({
      entity: "supplier_offer",
      fields: ["variant_id"],
      filters: { supplier_id: command.supplier_id },
      withDeleted: true,
    });
    return new StepResponse([
      ...new Set(data.map((offer) => offer.variant_id)),
    ]);
  },
);
