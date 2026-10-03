/** Значение характеристики у товара (`variant_id = null`) или варианта — с самой характеристикой. */
export type AttributeValueDTO = {
  id: string;
  attribute_id: string;
  attribute: {
    name: string;
    handle: string;
    type: "string" | "number" | "boolean";
    unit: string | null;
  };
  variant_id: string | null;
  value: string;
  handle: string;
  number: number | null;
};
