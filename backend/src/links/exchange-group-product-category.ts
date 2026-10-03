import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import ExchangeModule from "../modules/exchange";

/** Категория магазина группы поставщика (read-only по `category_id`): `exchange_group.product_category` — маппинг. */
export default defineLink(
  { linkable: ExchangeModule.linkable.exchangeGroup, field: "category_id" },
  ProductModule.linkable.productCategory,
  { readOnly: true },
);
