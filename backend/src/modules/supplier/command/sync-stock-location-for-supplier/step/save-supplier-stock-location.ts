import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SUPPLIER_MODULE } from "../../../index";
import type { SupplierModuleService } from "../../../service/supplier-module-service";

/** Запоминает склад за поставщиком. Пишет мимо workflow фабрики — событие `supplier.updated` здесь не нужно. */
export const saveSupplierStockLocationStep = createStep(
  "save-supplier-stock-location",
  async (
    input: { supplier_id: string; stock_location_id: string },
    { container },
  ) => {
    const suppliers = container.resolve<SupplierModuleService>(SUPPLIER_MODULE);
    await suppliers.updateSuppliers({
      id: input.supplier_id,
      stock_location_id: input.stock_location_id,
    });
    return new StepResponse(input.stock_location_id, input.supplier_id);
  },
  async (supplierId, { container }) => {
    if (!supplierId) return;
    const suppliers = container.resolve<SupplierModuleService>(SUPPLIER_MODULE);
    await suppliers.updateSuppliers({
      id: supplierId,
      stock_location_id: null,
    });
  },
);
