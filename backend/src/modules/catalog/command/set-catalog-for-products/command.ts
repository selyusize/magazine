/**
 * Бренд и основная категория сразу для пачки товаров (импорт поставщика). Как у `update-catalog-for-product`:
 * поле не передано — не меняется, `null` — снять.
 */
export type SetCatalogForProductsCommand = {
  items: {
    product_id: string;
    brand_id?: string | null;
    main_category_id?: string | null;
  }[];
};
