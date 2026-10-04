/** Связи «категория → магазин», которые нужно снять: откат хука `categoriesCreated`. */
export type RemoveShopFromCategoriesCommand = {
  links: { category_id: string; shop_id: string }[];
};
