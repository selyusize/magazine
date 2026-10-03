"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  appendSearchParams,
  countActive,
  filterSearchParams,
  formatRangeValue,
  rangeValue,
  toRangeValue,
  type FilterGroup,
  type FilterOption,
  type FilterState,
} from "./filters";

/** Секция-список: значения и выбор черновика */
export type FilterListSectionView = {
  type: "checkbox" | "radio" | "color";
  key: string;
  label: string;
  options: FilterOption[];
  selected: string[];
};

/** Секция-слайдер: границы и выбор черновика */
export type FilterRangeSectionView = {
  type: "range";
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  /** Подписи границ: «1 000 ₽», «5 000 ₽» — числа уже отформатированы */
  valueLabels: [string, string];
};

/** Секция шторки для представления */
export type FilterSectionView = FilterListSectionView | FilterRangeSectionView;

export type UseCatalogFilterOptions = {
  groups: FilterGroup[];
  /** Фильтры из URL — с ними открывается шторка */
  applied: FilterState;
  /** Адрес выдачи без фильтров и страницы (с `?sort=`, если выбрана) */
  baseHref: string;
};

/** Секции по группам и черновику. Чистая функция — проверяется без React */
export function toFilterSections(groups: FilterGroup[], draft: FilterState): FilterSectionView[] {
  return groups.map((group) => {
    if (group.type !== "range") return { ...group, selected: draft[group.key] ?? [] };
    const value = rangeValue(group, draft[group.key]?.[0]);
    return {
      type: "range",
      key: group.key,
      label: group.label,
      min: group.min,
      max: group.max,
      step: group.step,
      value,
      valueLabels: [formatRangeValue(group, value[0]), formatRangeValue(group, value[1])],
    };
  });
}

/**
 * Шторка фильтров: выбор копится в черновике и применяется кнопкой — один переход на новый адрес вместо
 * перезагрузки выдачи на каждый клик. Выдачу рендерит сервер по URL, поэтому фильтр работает по ссылке.
 */
export function useCatalogFilter({ groups, applied, baseHref }: UseCatalogFilterOptions) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(applied);

  const setValues = (key: string, values: string[]) =>
    setDraft((current) => {
      const next = { ...current, [key]: values };
      if (!values.length) delete next[key];
      return next;
    });

  return {
    open,
    /** Каждое открытие начинается с применённых фильтров: незакрытый черновик не тянется в следующий раз */
    onOpenChange: (next: boolean) => {
      if (next) setDraft(applied);
      setOpen(next);
    },
    sections: toFilterSections(groups, draft),
    activeCount: countActive(applied),
    canReset: countActive(draft) > 0,
    onValuesChange: setValues,
    onRangeChange: (key: string, value: [number, number]) => {
      const group = groups.find((item) => item.key === key);
      const next = group?.type === "range" ? toRangeValue(group, value) : undefined;
      setValues(key, next ? [next] : []);
    },
    onReset: () => setDraft({}),
    onApply: () => {
      setOpen(false);
      router.push(appendSearchParams(baseHref, filterSearchParams(draft, groups)));
    },
  };
}

export type CatalogFilterState = ReturnType<typeof useCatalogFilter>;
