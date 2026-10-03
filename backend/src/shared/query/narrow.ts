/**
 * Сужение неизвестных значений без приведений типов: строки Query с JSON-полями и связями, ответы внешних API,
 * параметры из метаданных. Не то, что ожидали, — значение по умолчанию, а не `as` (arch-guide, п.12).
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isString = (value: unknown): value is string => typeof value === "string";

/** Объект или пустой объект. */
export const recordOf = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

/** Вложенный объект или `null` (связь Query: `product.brand`). */
export const recordOrNull = (value: unknown): Record<string, unknown> | null => (isRecord(value) ? value : null);

export const text = (value: unknown, fallback = ""): string => (isString(value) ? value : fallback);

export const textOrNull = (value: unknown): string | null => (isString(value) ? value : null);

/** Число из числа или числовой строки (bigNumber Medusa приходит строкой). */
export const numberOrNull = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (isString(value) && value.trim()) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  return null;
};

export const numberOr = (value: unknown, fallback = 0): number => numberOrNull(value) ?? fallback;

export const dateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (!isString(value) && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Дата, которая обязана быть (`created_at`); нет — начало эпохи, а не исключение в маппинге ответа. */
export const toDate = (value: unknown): Date => dateOrNull(value) ?? new Date(0);

export const texts = (value: unknown): string[] => (Array.isArray(value) ? value.filter(isString) : []);

export const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

/** Словарь строк: `{ "Ид": "значение" }`; нестроковые значения отбрасываются. */
export const textRecord = (value: unknown): Record<string, string> =>
  Object.fromEntries(Object.entries(recordOf(value)).filter((entry): entry is [string, string] => isString(entry[1])));

/** Значение из списка допустимых или `fallback`. */
export const oneOf = <T extends string | number>(value: unknown, options: readonly T[], fallback: T): T =>
  options.find((option) => option === value) ?? fallback;

/** Значение из списка допустимых или `null`. */
export const oneOfOrNull = <T extends string | number>(value: unknown, options: readonly T[]): T | null =>
  options.find((option) => option === value) ?? null;
