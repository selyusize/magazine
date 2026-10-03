/**
 * Характеристики уровня товара (`variant_id = null`) сразу для пачки товаров — импорт поставщика. Значения каждого
 * товара заменяют прежние целиком; несколько значений одной характеристики — несколько элементов.
 */
export type SetAttributeValuesForProductsCommand = {
  items: {
    product_id: string;
    values: { attribute_id: string; value: string }[];
  }[];
};
