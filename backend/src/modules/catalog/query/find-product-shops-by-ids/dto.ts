/** Товар и его магазин (единственный канал магазина); без магазина — `null`. */
export type ProductShopRefDTO = {
  product_id: string;
  title: string;
  shop_id: string | null;
};
