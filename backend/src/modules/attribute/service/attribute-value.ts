import { MedusaError } from "@medusajs/framework/utils";

import { oneOf, recordOf, text } from "@shared/query/narrow";
import { toSlug } from "@shared/service/slug/slug";

export const ATTRIBUTE_TYPES = ["string", "number", "boolean"] as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

/** Характеристика из строки Query: id, название и тип (неизвестный тип — строка). */
export const toAttributeRef = (value: unknown): { id: string; name: string; type: AttributeType } => {
  const row = recordOf(value);
  return { id: text(row.id), name: text(row.name), type: oneOf(row.type, ATTRIBUTE_TYPES, "string") };
};

/** Значение, готовое к записи: как показывать, slug для адреса фильтра, число для диапазонов. */
export type NormalizedAttributeValue = {
  value: string;
  handle: string;
  number: number | null;
};

const TRUE = new Set(["true", "1", "да", "yes", "есть"]);
const FALSE = new Set(["false", "0", "нет", "no"]);

/** Результат разбора: значение (или `null` — пусто) либо текст ошибки. */
export type ParsedAttributeValue =
  | { value: NormalizedAttributeValue | null; error?: undefined }
  | { value?: undefined; error: string };

const invalid = (name: string, raw: string, expected: string): ParsedAttributeValue => ({
  error: `Характеристика «${name}»: «${raw}» — не ${expected}`,
});

/**
 * Приводит значение из админки или выгрузки поставщика к типу характеристики. Пустое — `null` (значения нет).
 * Число принимает и запятую («1,5»); да/нет — `true`/`false`, подпись выбирает витрина.
 */
export function normalizeAttributeValue(
  attribute: { name: string; type: AttributeType },
  raw: string,
): NormalizedAttributeValue | null {
  const parsed = parseAttributeValue(attribute, raw);
  if (parsed.error !== undefined) throw new MedusaError(MedusaError.Types.INVALID_DATA, parsed.error);
  return parsed.value;
}

/** То же без исключения — для импорта: неподходящее значение пропускается с ошибкой в логе, пачка не падает. */
export function parseAttributeValue(
  attribute: { name: string; type: AttributeType },
  raw: string,
): ParsedAttributeValue {
  const text = raw.trim().replace(/\s+/g, " ");
  if (!text) return { value: null };

  switch (attribute.type) {
    case "number": {
      const number = Number(text.replace(",", ".").replace(/\s/g, ""));
      if (!Number.isFinite(number)) return invalid(attribute.name, raw, "число");
      const value = String(number);
      return { value: { value, handle: toSlug(value), number } };
    }
    case "boolean": {
      const lower = text.toLowerCase();
      if (!TRUE.has(lower) && !FALSE.has(lower)) return invalid(attribute.name, raw, "да/нет");
      const value = TRUE.has(lower) ? "true" : "false";
      return { value: { value, handle: value, number: null } };
    }
    default:
      // Значение из одних знаков («—») оставляем текстом, в адрес фильтра — запасной код
      return { value: { value: text, handle: toSlug(text) || "value", number: null } };
  }
}
