import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import CatalogModule from "../modules/catalog";

/**
 * Основная категория товара (read-only по `product_main_category.product_id`): Query отдаёт
 * `product.product_main_category.product_category` — для крошек, canonical и проверки перед публикацией.
 */
export default defineLink(
  { linkable: ProductModule.linkable.product, field: "id" },
  {
    ...CatalogModule.linkable.productMainCategory.id,
    primaryKey: "product_id",
  },
  { readOnly: true },
);
