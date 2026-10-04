import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import ShopModule from "../modules/shop";

/**
 * Дерево категорий магазина: у магазина много категорий, у категории — один магазин. Корень (`shop.root_category_id`)
 * связывает `create-shop`, остальные — хук `categoriesCreated` по родителю (`src/workflows/hooks/product-category-shop.ts`).
 * Query: `shop.product_categories`, `product_category.shop`.
 */
export default defineLink(ShopModule.linkable.shop, {
  linkable: ProductModule.linkable.productCategory,
  isList: true,
});
