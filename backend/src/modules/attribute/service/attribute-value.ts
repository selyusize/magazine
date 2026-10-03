import { MedusaError } from "@medusajs/framework/utils";

import { toSlug } from "@shared/service/slug/slug";

export type AttributeType = "string" | "number" | "boolean";

/** Значение, готовое к записи: как показывать, slug для адреса фильтра, число для диапазонов. */
export type NormalizedAttributeValue = {
  value: string;
  handle: string;
  number: number | null;
};

const TRUE = new Set(["true", "1", "да", "yes", "есть"]);
const FALSE = new Set(["false", "0", "нет", "no"]);

const invalid = (name: string, raw: string, expected: string) =>
  new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `Характеристика «${name}»: «${raw}» — не ${expected}`,
  );

/**
 * Приводит значение из админки или выгрузки поставщика к типу характеристики. Пустое — `null` (значения нет).
 * Число принимает и запятую («1,5»); да/нет — `true`/`false`, подпись выбирает витрина.
 */
export function normalizeAttributeValue(
  attribute: { name: string; type: AttributeType },
  raw: string,
): NormalizedAttributeValue | null {
  const text = raw.trim().replace(/\s+/g, " ");
  if (!text) return null;

  switch (attribute.type) {
    case "number": {
      const number = Number(text.replace(",", ".").replace(/\s/g, ""));
      if (!Number.isFinite(number)) throw invalid(attribute.name, raw, "число");
      const value = String(number);
      return { value, handle: toSlug(value), number };
    }
    case "boolean": {
      const lower = text.toLowerCase();
      if (!TRUE.has(lower) && !FALSE.has(lower))
        throw invalid(attribute.name, raw, "да/нет");
      const value = TRUE.has(lower) ? "true" : "false";
      return { value, handle: value, number: null };
    }
    default:
      // Значение из одних знаков («—») оставляем текстом, в адрес фильтра — запасной код
      return { value: text, handle: toSlug(text) || "value", number: null };
  }
}
