import type { ShopRef } from "@shared/shop/shop-ref";

/**
 * Коллекции — в магазин: из хука `collectionsCreated` (`additional_data.shop_id` или префикс handle) и из карточки
 * коллекции в админке (`POST /admin/collections/:id/shop`).
 */
export type AssignShopToCollectionsCommand = {
  collection_ids: string[];
  shop: ShopRef;
};
