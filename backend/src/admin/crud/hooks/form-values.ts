import type { CRUDField, CRUDRow } from "../types";

/** Значение поля в форме: строки для текстов, select, категории и JSON; boolean — для переключателя. */
export type FormValue = string | boolean;
export type FormValues = Record<string, FormValue>;

/** Начальные значения формы: из строки (изменение) или значения по умолчанию (создание). */
export function toFormValues(
  fields: CRUDField[],
  row: CRUDRow | null,
): FormValues {
  return Object.fromEntries(
    fields.map((field): [string, FormValue] => {
      const value = row?.[field.name];
      switch (field.type) {
        case "boolean":
          return [
            field.name,
            typeof value === "boolean" ? value : (field.default ?? true),
          ];
        case "select":
          return [
            field.name,
            typeof value === "string" ? value : field.default,
          ];
        case "number":
          return [
            field.name,
            typeof value === "number"
              ? String(value)
              : field.default !== undefined
                ? String(field.default)
                : "",
          ];
        case "json":
          return [
            field.name,
            value && Object.keys(value).length
              ? JSON.stringify(value, null, 2)
              : "",
          ];
        default:
          return [field.name, typeof value === "string" ? value : ""];
      }
    }),
  );
}

export class InvalidJSONError extends Error {
  constructor(readonly field: string) {
    super(`Поле ${field}: некорректный JSON`);
  }
}

function toBodyValue(field: CRUDField, value: FormValue): unknown {
  if (field.type === "boolean") return value;
  const text = String(value).trim();
  if (field.type === "number") return text === "" ? undefined : Number(text);
  if (field.type === "json") {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new InvalidJSONError(field.name);
    }
  }
  if (
    !text &&
    (field.type === "text" || field.type === "textarea") &&
    field.nullable
  )
    return null;
  return text;
}

/** Поле `createOnly` в форме изменения: заблокировано. */
export const isLocked = (field: CRUDField, editing: boolean): boolean =>
  editing && field.type === "text" && field.createOnly === true;

/** Поле уходит в тело: показные — никогда, заблокированные — нет. */
const isSent = (field: CRUDField, editing: boolean): boolean =>
  field.type !== "readonly" && !isLocked(field, editing);

/** Поле есть в форме: показные — только у существующей записи. */
export const isVisible = (field: CRUDField, editing: boolean): boolean =>
  field.type !== "readonly" || editing;

/**
 * Тело запроса. Создание — все заполненные поля (пустой handle не шлём: бэкенд сделает его из названия).
 * Изменение — только изменённые поля: так переименование не трогает адрес, а очищенный handle (`""`)
 * просит бэкенд построить его заново.
 */
export function toRequestBody(
  fields: CRUDField[],
  values: FormValues,
  initial: FormValues | null,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of fields) {
    if (!isSent(field, initial !== null)) continue;
    const value = values[field.name];
    if (initial && value === initial[field.name]) continue;

    const bodyValue = toBodyValue(field, value);
    if (bodyValue === undefined) continue;
    if (!initial && (bodyValue === "" || bodyValue === null)) continue;
    body[field.name] = bodyValue;
  }
  return body;
}

/** Все обязательные поля заполнены. */
export function isComplete(fields: CRUDField[], values: FormValues): boolean {
  return fields.every(
    (field) =>
      !("required" in field && field.required) ||
      String(values[field.name] ?? "").trim() !== "",
  );
}
