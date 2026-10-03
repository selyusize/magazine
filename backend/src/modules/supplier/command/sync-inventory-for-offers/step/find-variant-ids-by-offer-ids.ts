import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import type { SyncInventoryForOffersCommand } from "../command";

/** Только чтение: варианты предложений, включая удалённые — их остаток тоже нужно пересчитать. */
export const findVariantIdsByOfferIdsStep = createStep(
  "find-variant-ids-by-offer-ids",
  async (command: SyncInventoryForOffersCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data } = await query.graph({
      entity: "supplier_offer",
      fields: ["variant_id"],
      filters: { id: command.offer_ids },
      withDeleted: true,
    });
    return new StepResponse([
      ...new Set(data.map((offer) => offer.variant_id)),
    ]);
  },
);
