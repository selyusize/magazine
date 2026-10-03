import type { CatalogSortOption } from "@shared/config";

export type SortMenuItem = { label: string; href: string; active: boolean };

/** Значение `?sort=` из URL → вариант сортировки. Неизвестное или пустое — первый вариант (по умолчанию). */
export function resolveSort<T extends CatalogSortOption>(value: string | undefined, options: readonly T[]): T | undefined {
  return options.find((option) => option.value === value) ?? options[0];
}

/**
 * Пункты меню сортировки. href(value) строит адрес страницы; для варианта по умолчанию передаётся undefined —
 * у выдачи без сортировки один URL без `?sort`.
 */
export function sortMenuItems(
  options: readonly CatalogSortOption[],
  current: CatalogSortOption | undefined,
  href: (value: string | undefined) => string,
): SortMenuItem[] {
  return options.map((option, index) => ({
    label: option.label,
    href: href(index === 0 ? undefined : option.value),
    active: option === current,
  }));
}
