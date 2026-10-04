/** Новые категории получают магазин родителя (хук `categoriesCreated`). Корень магазина связывает `create-shop`. */
export type AssignShopToCategoriesCommand = {
  category_ids: string[];
};
