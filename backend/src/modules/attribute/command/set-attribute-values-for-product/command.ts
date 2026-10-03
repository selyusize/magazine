/**
 * Все значения характеристик товара (`variant_id = null`) или одного его варианта — заменяют прежние целиком.
 * Несколько значений одной характеристики — несколько элементов с одним `attribute_id`.
 */
export type SetAttributeValuesForProductCommand = {
  product_id: string;
  variant_id: string | null;
  values: { attribute_id: string; value: string }[];
};
