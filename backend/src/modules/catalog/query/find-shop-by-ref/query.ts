import type { ShopRef } from "@shared/shop/shop-ref";

/** Магазин по id или slug. */
export type FindShopByRefQuery = {
  shop: ShopRef;
};
