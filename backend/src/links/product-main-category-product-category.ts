import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import CatalogModule from "../modules/catalog";

/** Категория за записью «основная категория» (read-only по `category_id`): `product_main_category.product_category`. */
export default defineLink(
  {
    linkable: CatalogModule.linkable.productMainCategory,
    field: "category_id",
  },
  ProductModule.linkable.productCategory,
  { readOnly: true },
);
