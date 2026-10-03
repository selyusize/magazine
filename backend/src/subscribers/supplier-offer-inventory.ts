import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { SyncInventoryForOffersHandler } from "@domain/supplier/command/sync-inventory-for-offers/handler";

/** Предложение создали, изменили или удалили → остаток варианта на складе поставщика. Повтор безопасен. */
export default async function supplierOfferInventory({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(SyncInventoryForOffersHandler)
    .handle({ offer_ids: [data.id] });
}

export const config: SubscriberConfig = {
  event: [
    "supplier_offer.created",
    "supplier_offer.updated",
    "supplier_offer.deleted",
  ],
};
