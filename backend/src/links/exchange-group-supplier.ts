import { defineLink } from "@medusajs/framework/utils";

import ExchangeModule from "../modules/exchange";
import SupplierModule from "../modules/supplier";

/** Поставщик группы (read-only по `supplier_id`): `exchange_group.supplier.shop_id` — магазин для админки. */
export default defineLink(
  { linkable: ExchangeModule.linkable.exchangeGroup, field: "supplier_id" },
  SupplierModule.linkable.supplier,
  { readOnly: true },
);
