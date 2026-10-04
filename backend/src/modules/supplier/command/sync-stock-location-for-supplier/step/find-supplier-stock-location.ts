import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { recordOf, recordOrNull, textOrNull } from "@shared/query/narrow";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import type { SyncStockLocationForSupplierCommand } from "../command";

/** Магазин работает по России (этап 1): склады поставщиков — в РФ. */
const COUNTRY_CODE = "RU";

export type SupplierStockLocation = {
  supplier_id: string;
  stock_location_id: string | null;
  /** Название и адрес склада, какими они должны быть. */
  location: {
    name: string;
    address: { city: string; address_1: string; country_code: string };
  };
  /** Канал продаж магазина поставщика: склад только в нём — остатки видны в корзине только этого магазина. */
  sales_channel_id: string | null;
};

/** Только чтение: поставщик (удалён — `null`, делать нечего) и канал продаж его магазина. */
export const findSupplierStockLocationStep = createStep(
  "find-supplier-stock-location",
  async (command: SyncStockLocationForSupplierCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: suppliers } = await query.graph({
      entity: "supplier",
      fields: [
        "id",
        "name",
        "ship_city",
        "ship_address",
        "stock_location_id",
        "shop.sales_channel.id",
      ],
      filters: { id: command.supplier_id },
    });
    const supplier = suppliers[0];
    if (!supplier) return new StepResponse<SupplierStockLocation | null>(null);

    return new StepResponse<SupplierStockLocation | null>({
      supplier_id: supplier.id,
      stock_location_id: supplier.stock_location_id ?? null,
      location: {
        name: `Поставщик «${supplier.name}»`,
        address: {
          city: supplier.ship_city,
          address_1: supplier.ship_address ?? "",
          country_code: COUNTRY_CODE,
        },
      },
      sales_channel_id: textOrNull(
        recordOrNull(recordOrNull(recordOf(supplier).shop)?.sales_channel)?.id,
      ),
    });
  },
);
