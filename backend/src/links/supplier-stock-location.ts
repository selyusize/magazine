import { defineLink } from "@medusajs/framework/utils";
import StockLocationModule from "@medusajs/medusa/stock-location";

import SupplierModule from "../modules/supplier";

/** Виртуальный склад поставщика (read-only по `stock_location_id`): Query отдаёт `supplier.stock_location`. */
export default defineLink(
  { linkable: SupplierModule.linkable.supplier, field: "stock_location_id" },
  StockLocationModule.linkable.stockLocation,
  { readOnly: true },
);
