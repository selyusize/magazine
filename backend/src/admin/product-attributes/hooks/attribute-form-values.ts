import type { Attribute, AttributeValue } from "./product-attributes-api";

/** Несколько значений одной характеристики в поле — через «;» (запятая бывает в числах и названиях). */
export const VALUE_SEPARATOR = "; ";

/** Поле формы на характеристику: значения уровня товара через разделитель. */
export function toAttributeFormValues(
  attributes: Attribute[],
  values: AttributeValue[],
): Record<string, string> {
  return Object.fromEntries(
    attributes.map((attribute) => [
      attribute.id,
      values
        .filter(
          (value) =>
            value.attribute_id === attribute.id && value.variant_id === null,
        )
        .map((value) => value.value)
        .join(VALUE_SEPARATOR),
    ]),
  );
}

/** Тело запроса: пустые поля — без значения, у строковых несколько значений через «;». */
export function toAttributeValuesBody(
  attributes: Attribute[],
  form: Record<string, string>,
): { attribute_id: string; value: string }[] {
  return attributes.flatMap((attribute) => {
    const text = (form[attribute.id] ?? "").trim();
    if (!text) return [];
    const parts =
      attribute.type === "string"
        ? text
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
        : [text];
    return parts.map((value) => ({ attribute_id: attribute.id, value }));
  });
}
