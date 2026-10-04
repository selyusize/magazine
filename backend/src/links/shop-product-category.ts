import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import ShopModule from "../modules/shop";

/** Корневая категория магазина (read-only по `root_category_id`): `shop.product_category`. */
export default defineLink(
  { linkable: ShopModule.linkable.shop, field: "root_category_id" },
  ProductModule.linkable.productCategory,
  { readOnly: true },
);
