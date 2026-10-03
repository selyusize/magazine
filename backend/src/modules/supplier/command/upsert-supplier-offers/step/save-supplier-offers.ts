import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SUPPLIER_MODULE } from "../../../index";
import type { SupplierModuleService } from "../../../service/supplier-module-service";
import type { UpsertSupplierOffersCommand } from "../command";

type OfferInput = UpsertSupplierOffersCommand["offers"][number];
type Previous = {
  id: string;
  variant_id: string;
  sku: string | null;
  barcode: string | null;
  purchase_price: number | null;
  quantity: number;
  synced_at: Date | null;
};

export type SavedSupplierOffers = {
  created: number;
  updated: number;
  /** Варианты, чей остаток мог измениться, — для пересчёта inventory. */
  variant_ids: string[];
};

const price = (value: unknown): number | null => (value === null || value === undefined ? null : Number(value));

/**
 * Создаёт новые и обновляет пришедшие предложения. `synced_at` пишется всегда — по нему полная выгрузка обнуляет
 * пропавшие предложения, а этап 5 — устаревшие. Откат удаляет созданные и возвращает прежние значения.
 */
export const saveSupplierOffersStep = createStep(
  "save-supplier-offers",
  async (command: UpsertSupplierOffersCommand, { container }) => {
    const empty: { created: string[]; previous: Previous[] } = { created: [], previous: [] };
    if (!command.offers.length)
      return new StepResponse<SavedSupplierOffers, typeof empty>({ created: 0, updated: 0, variant_ids: [] }, empty);

    const suppliers = container.resolve<SupplierModuleService>(SUPPLIER_MODULE);
    const existing = await suppliers.listSupplierOffers({
      $or: [...groupBySupplier(command.offers)].map(([supplier_id, external_ids]) => ({
        supplier_id,
        external_id: external_ids,
      })),
    });
    const byKey = new Map(existing.map((offer) => [`${offer.supplier_id}\u0000${offer.external_id}`, offer]));

    const toCreate: OfferInput[] = [];
    const toUpdate: {
      id: string;
      variant_id: string;
      sku: string | null;
      barcode: string | null;
      purchase_price: number | null;
      quantity: number;
      synced_at: Date;
    }[] = [];
    const previous: Previous[] = [];
    const variantIds = new Set<string>();
    let changed = 0;

    for (const offer of command.offers) {
      const current = byKey.get(`${offer.supplier_id}\u0000${offer.external_id}`);
      if (!current) {
        toCreate.push(offer);
        variantIds.add(offer.variant_id);
        continue;
      }
      const quantity = offer.quantity ?? Number(current.quantity);
      if (
        current.variant_id !== offer.variant_id ||
        (current.sku ?? null) !== offer.sku ||
        (current.barcode ?? null) !== offer.barcode ||
        price(current.purchase_price) !== offer.purchase_price ||
        Number(current.quantity) !== quantity
      ) {
        changed++;
        variantIds.add(offer.variant_id).add(current.variant_id);
      }
      toUpdate.push({
        id: current.id,
        variant_id: offer.variant_id,
        sku: offer.sku,
        barcode: offer.barcode,
        purchase_price: offer.purchase_price,
        quantity,
        synced_at: new Date(offer.synced_at),
      });
      previous.push({
        id: current.id,
        variant_id: current.variant_id,
        sku: current.sku ?? null,
        barcode: current.barcode ?? null,
        purchase_price: price(current.purchase_price),
        quantity: Number(current.quantity),
        synced_at: current.synced_at ?? null,
      });
    }

    const created = toCreate.length
      ? await suppliers.createSupplierOffers(
          toCreate.map((offer) => ({ ...offer, quantity: offer.quantity ?? 0, synced_at: new Date(offer.synced_at) })),
        )
      : [];
    if (toUpdate.length) await suppliers.updateSupplierOffers(toUpdate);

    return new StepResponse<SavedSupplierOffers, typeof empty>(
      { created: created.length, updated: changed, variant_ids: [...variantIds] },
      { created: created.map((offer) => offer.id), previous },
    );
  },
  async (undo, { container }) => {
    if (!undo) return;
    const suppliers = container.resolve<SupplierModuleService>(SUPPLIER_MODULE);
    if (undo.created.length) await suppliers.deleteSupplierOffers(undo.created);
    if (undo.previous.length) await suppliers.updateSupplierOffers(undo.previous);
  },
);

function groupBySupplier(offers: OfferInput[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const offer of offers) groups.set(offer.supplier_id, [...(groups.get(offer.supplier_id) ?? []), offer.external_id]);
  return groups;
}
