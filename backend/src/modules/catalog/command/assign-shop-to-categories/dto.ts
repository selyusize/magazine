/** Созданные связи «категория → магазин» — по ним хук откатывает назначение (`remove-shop-from-categories`). */
export type AssignedCategoryShopDTO = {
  category_id: string;
  shop_id: string;
};
