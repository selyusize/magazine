/** Категория дерева магазина для выбора в админке (основная категория, категория посадочной, маппинг групп). */
export type ShopCategoryDTO = {
  id: string;
  name: string;
  handle: string;
  parent_category_id: string | null;
};
