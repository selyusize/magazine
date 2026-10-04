import { defineLink } from "@medusajs/framework/utils";

import ExchangeModule from "../modules/exchange";
import SupplierModule from "../modules/supplier";

/** Поставщик свойства (read-only по `supplier_id`): `exchange_property.supplier.shop_id` — магазин для админки. */
export default defineLink(
  { linkable: ExchangeModule.linkable.exchangeProperty, field: "supplier_id" },
  SupplierModule.linkable.supplier,
  { readOnly: true },
);
