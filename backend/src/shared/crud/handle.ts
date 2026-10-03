import { MedusaError } from "@medusajs/framework/utils";

import { toSlug, toUniqueSlug } from "../service/slug/slug";

export type ResolveHandleInput = {
  /** Handle из запроса: `undefined` — не меняли, пустая строка — «сгенерировать из названия». */
  requested: string | undefined;
  /** Название сущности — из запроса или текущее. */
  title: string;
  /** Текущий handle (`null` — сущность создаётся). */
  current: string | null;
  /** Поменялась область уникальности (категория посадочной) — текущий handle может оказаться занят. */
  scope_changed: boolean;
  /** Запасной slug, если ни в handle, ни в названии нет букв и цифр. */
  fallback: string;
  isTaken: (candidate: string) => Promise<boolean>;
};

/**
 * Handle сущности по правилам витрины. `null` — менять не нужно.
 * - Задан явно → slug из него; занят — ошибка: админ выбрал адрес сам, молча менять его нельзя.
 * - Не задан при создании (или пустой) → slug из названия, занят — `-2`, `-3`…
 * - Не задан при изменении → прежний; переименование сущности адрес не меняет (стабильные URL), а если сменилась
 *   область уникальности и прежний занят — добавляется суффикс.
 */
export async function resolveHandle(
  input: ResolveHandleInput,
): Promise<string | null> {
  const { requested, current } = input;

  if (requested === undefined && current !== null) {
    if (!input.scope_changed || !(await input.isTaken(current))) return null;
    return toUniqueSlug(current, input.isTaken);
  }

  const explicit = requested ? toSlug(requested) : "";
  if (explicit) {
    if (
      (explicit !== current || input.scope_changed) &&
      (await input.isTaken(explicit))
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Адрес «${explicit}» уже занят — укажите другой`,
      );
    }
    return explicit === current ? null : explicit;
  }

  const base = toSlug(input.title) || input.fallback;
  return toUniqueSlug(base, input.isTaken);
}
