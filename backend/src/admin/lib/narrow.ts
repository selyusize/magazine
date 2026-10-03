/** Сужение ответов Admin API и значений Select без приведений типов: не то, что ждали, — значение по умолчанию. */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Значение из списка допустимых или `null` (строка из Select — в литеральный тип). */
export const oneOfOrNull = <T extends string | number>(value: unknown, options: readonly T[]): T | null =>
  options.find((option) => option === value) ?? null;

export const oneOf = <T extends string | number>(value: unknown, options: readonly T[], fallback: T): T =>
  oneOfOrNull(value, options) ?? fallback;
