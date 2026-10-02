/**
 * Единое правило имён между бэкендом и фронтом: Medusa говорит snake_case, фронт — camelCase.
 * Используется в двух местах, поэтому типы и данные всегда совпадают:
 * - orval.transformer.ts — переименовывает поля в OpenAPI-спецификации перед генерацией типов;
 * - http.ts — преобразует данные в рантайме (ответы → camelCase, тела и query → snake_case).
 *
 * Преобразование обратимо: `unit_price ↔ unitPrice`, а `address_1` остаётся `address_1`
 * (подчёркивание перед цифрой не трогается — иначе `address1` уже не превратить обратно).
 */

/** Содержимое этих полей — произвольные данные магазина/интеграций, их ключи не трогаем. */
const OPAQUE_KEYS = new Set(["metadata", "additional_data", "additionalData"]);

export const isOpaqueKey = (key: string) => OPAQUE_KEYS.has(key);

export function snakeToCamel(key: string): string {
  return key.replace(/(?<=[a-z0-9])_([a-z])/g, (_, char: string) => char.toUpperCase());
}

export function camelToSnake(key: string): string {
  return key.replace(/(?<=[a-z0-9])([A-Z])/g, (_, char: string) => `_${char.toLowerCase()}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function mapKeys(value: unknown, convert: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => mapKeys(item, convert));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      convert(key),
      isOpaqueKey(key) ? nested : mapKeys(nested, convert),
    ]),
  );
}

/** Ответ бэкенда → данные фронта. */
export const camelizeKeys = <T = unknown>(value: unknown) => mapKeys(value, snakeToCamel) as T;

/** Данные фронта → тело запроса / query бэкенда. */
export const snakeizeKeys = <T = unknown>(value: unknown) => mapKeys(value, camelToSnake) as T;
