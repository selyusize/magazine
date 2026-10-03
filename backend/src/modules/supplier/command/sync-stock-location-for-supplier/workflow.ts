import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  releaseLockStep,
  updateStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows";

import { syncInventoryForSupplierWorkflow } from "../sync-inventory-for-supplier/workflow";
import type { SyncStockLocationForSupplierCommand } from "./command";
import { findSupplierStockLocationStep } from "./step/find-supplier-stock-location";
import { saveSupplierStockLocationStep } from "./step/save-supplier-stock-location";

/** Иначе `supplier.created` и сразу за ним `supplier.updated` создали бы поставщику два склада. */
const LOCK_KEY = "supplier-stock-location";

/**
 * Склад поставщика: нет — создаёт виртуальный stock location «Поставщик «…»» с городом отгрузки (от него считают
 * доставку перевозчики) и добавляет его в канал продаж магазина; есть — обновляет название и адрес. Затем
 * пересчитывает остатки поставщика: склад мог только появиться, а поставщика — выключить или включить.
 * Только готовые workflows Medusa, у каждого свой откат.
 */
export const syncStockLocationForSupplierWorkflow = createWorkflow(
  "sync-stock-location-for-supplier",
  (command: SyncStockLocationForSupplierCommand) => {
    acquireLockStep({ key: LOCK_KEY, timeout: 30, ttl: 60 });
    const found = findSupplierStockLocationStep(command);

    const created = when(
      "create-supplier-stock-location",
      found,
      (found) => !!found && !found.stock_location_id,
    ).then(() => {
      const locations = createStockLocationsWorkflow.runAsStep({
        input: transform(found, (found) => ({
          locations: [found!.location],
        })),
      });
      saveSupplierStockLocationStep(
        transform({ found, locations }, ({ found, locations }) => ({
          supplier_id: found!.supplier_id,
          stock_location_id: locations[0].id,
        })),
      );
      return locations;
    });

    when(
      "link-supplier-stock-location-to-sales-channel",
      { found, created },
      ({ found, created }) => !!created?.length && !!found?.sales_channel_id,
    ).then(() => {
      linkSalesChannelsToStockLocationWorkflow.runAsStep({
        input: transform({ found, created }, ({ found, created }) => ({
          id: created![0].id,
          add: [found!.sales_channel_id!],
        })),
      });
    });

    when(
      "update-supplier-stock-location",
      found,
      (found) => !!found?.stock_location_id,
    ).then(() => {
      updateStockLocationsWorkflow.runAsStep({
        input: transform(found, (found) => ({
          selector: { id: found!.stock_location_id! },
          update: found!.location,
        })),
      });
    });

    releaseLockStep({ key: LOCK_KEY });
    syncInventoryForSupplierWorkflow.runAsStep({ input: command });
    return new WorkflowResponse(undefined);
  },
);
