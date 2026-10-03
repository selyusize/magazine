/** Итог пачки: у каких товаров значения поменялись и какие значения не подошли к типу характеристики. */
export type SavedAttributeValuesDTO = {
  changed_product_ids: string[];
  errors: { product_id: string; message: string }[];
};
