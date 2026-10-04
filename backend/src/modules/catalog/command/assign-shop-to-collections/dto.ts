/** Созданные связи «коллекция → магазин» — по ним хук откатывает назначение (`remove-shop-from-collections`). */
export type AssignedCollectionShopDTO = {
  collection_id: string;
  shop_id: string;
};
