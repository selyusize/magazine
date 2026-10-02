import type { ReactNode } from "react";

/**
 * Значение региона лайаута (хедер, футер и т.п.):
 * - `undefined` — не передан: берётся вариант по умолчанию;
 * - `null` — регион скрыт;
 * - любой ReactNode — своя реализация вместо стандартной.
 */
export type Slot = ReactNode | null | undefined;

export function resolveSlot(value: Slot, fallback: () => ReactNode): ReactNode {
  return value === undefined ? fallback() : value;
}
