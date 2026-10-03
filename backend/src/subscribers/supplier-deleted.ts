import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { SyncInventoryForSupplierHandler } from "@domain/supplier/command/sync-inventory-for-supplier/handler";

/** Поставщика удалили (вместе с предложениями) → остатки на его складе обнуляются. Склад остаётся — в нём история резервов. */
export default async function supplierDeleted({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(SyncInventoryForSupplierHandler)
    .handle({ supplier_id: data.id });
}

export const config: SubscriberConfig = { event: "supplier.deleted" };
