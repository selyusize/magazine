import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { SyncStockLocationForSupplierHandler } from "@domain/supplier/command/sync-stock-location-for-supplier/handler";

/**
 * Поставщика создали или изменили → его склад создан и совпадает с ним, остатки на складе пересчитаны
 * (выключенный поставщик — нули). Повторное событие безопасно: склад уже есть, совпадающие остатки не пишутся.
 */
export default async function supplierStockLocation({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container)
    .get(SyncStockLocationForSupplierHandler)
    .handle({ supplier_id: data.id });
}

export const config: SubscriberConfig = {
  event: ["supplier.created", "supplier.updated"],
};
