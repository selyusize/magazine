import { defineLink } from "@medusajs/framework/utils";

import ShopModule from "../modules/shop";
import SupplierModule from "../modules/supplier";

/**
 * Магазин поставщика (read-only по `shop_id`): Query отдаёт `supplier.shop` — канал продаж для товаров и склада
 * поставщика, магазин брендов и характеристик из его выгрузки.
 */
export default defineLink(
  { linkable: SupplierModule.linkable.supplier, field: "shop_id" },
  ShopModule.linkable.shop,
  { readOnly: true },
);
