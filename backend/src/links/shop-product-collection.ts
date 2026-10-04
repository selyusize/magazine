import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import ShopModule from "../modules/shop";

/**
 * Коллекции магазина: у магазина много коллекций, у коллекции — один магазин (не меняется). Связь ставит хук
 * `collectionsCreated` (`additional_data.shop_id` или префикс handle) или админка (`POST /admin/collections/:id/shop`)
 * — коллекция из дашборда Medusa создаётся без магазина. Query: `shop.product_collections`, `product_collection.shop`.
 */
export default defineLink(ShopModule.linkable.shop, {
  linkable: ProductModule.linkable.productCollection,
  isList: true,
});
