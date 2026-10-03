/** Бренд и основная категория товара. Поле не передано — не меняется, `null` — снять. */
export type UpdateCatalogForProductCommand = {
  product_id: string;
  brand_id?: string | null;
  main_category_id?: string | null;
};
