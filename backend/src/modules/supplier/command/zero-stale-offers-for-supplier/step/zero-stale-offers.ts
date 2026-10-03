import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SUPPLIER_MODULE } from "../../../index";
import type { SupplierModuleService } from "../../../service/supplier-module-service";
import type { ZeroStaleOffersForSupplierCommand } from "../command";

/** Остаток в ноль у подходящих предложений с остатком. Откат возвращает остатки. */
export const zeroStaleOffersStep = createStep(
  "zero-stale-offers",
  async (command: ZeroStaleOffersForSupplierCommand, { container }) => {
    if (!command.synced_before && !command.variant_ids?.length)
      return new StepResponse<{ count: number; variant_ids: string[] }, { id: string; quantity: number }[]>(
        { count: 0, variant_ids: [] },
        [],
      );

    const suppliers = container.resolve<SupplierModuleService>(SUPPLIER_MODULE);
    const stale = await suppliers.listSupplierOffers(
      {
        supplier_id: command.supplier_id,
        quantity: { $gt: 0 },
        ...(command.variant_ids ? { variant_id: command.variant_ids } : {}),
        ...(command.synced_before
          ? { $or: [{ synced_at: null }, { synced_at: { $lt: new Date(command.synced_before) } }] }
          : {}),
      },
      { select: ["id", "variant_id", "quantity"] },
    );
    if (stale.length) await suppliers.updateSupplierOffers(stale.map((offer) => ({ id: offer.id, quantity: 0 })));
    return new StepResponse(
      { count: stale.length, variant_ids: [...new Set(stale.map((offer) => offer.variant_id))] },
      stale.map((offer) => ({ id: offer.id, quantity: Number(offer.quantity) })),
    );
  },
  async (previous, { container }) => {
    if (!previous?.length) return;
    await container.resolve<SupplierModuleService>(SUPPLIER_MODULE).updateSupplierOffers(previous);
  },
);
