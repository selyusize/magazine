import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import ExchangeModule from "../modules/exchange";

/** Карточка товара поставщика (read-only по `product_id`): `exchange_product.product` — очередь «требует разбора». */
export default defineLink(
  { linkable: ExchangeModule.linkable.exchangeProduct, field: "product_id" },
  ProductModule.linkable.product,
  { readOnly: true },
);
