import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import FilterPageModule from "../modules/filter-page";

/**
 * Категория посадочной без своей таблицы связи (read-only по `category_id`): Query отдаёт
 * `filter_page.product_category` — для пути `/catalog/{категория}/{handle}` и списка в админке.
 */
export default defineLink(
  { linkable: FilterPageModule.linkable.filterPage, field: "category_id" },
  ProductModule.linkable.productCategory,
  { readOnly: true },
);
