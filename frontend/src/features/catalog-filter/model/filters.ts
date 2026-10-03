import type { ProductFacets, SearchFacetRequest } from "@entities/product";
import type { CatalogFilter, CatalogFilterSource } from "@shared/config";
import { formatPrice } from "@shared/lib/format-price";
import { z } from "@shared/lib/zod";

/** Выбранные значения по ключу фильтра — как в URL: `{ size: ["S", "M"], price: ["1000-5000"] }` */
export type FilterState = Record<string, string[]>;

/** Границы «от — до». Не задана — без ограничения с этой стороны */
export type FilterRange = { min?: number; max?: number };

/** Значение фильтра-списка: подпись, число товаров, цвет кружка */
export type FilterOption = { value: string; label: string; count: number; color?: string };

/** Секция шторки: что показать и в каких пределах. Выбор — в FilterState */
export type FilterGroup =
  | { type: "checkbox" | "radio" | "color"; key: string; label: string; options: FilterOption[] }
  | { type: "range"; key: string; label: string; min: number; max: number; step: number; currencyCode?: string };

/** Поля индекса для запроса: цена — в валюте региона (`min_price_eur`), её может не быть в индексе */
export type FilterIndexContext = { priceField?: string; currencyCode?: string };

/** Порядок ключей в URL — порядок фильтров в конфиге: у одной выдачи один адрес */
type FilterOrder = readonly { key: string }[];

const MAX_VALUES = 50;
const RANGE_PATTERN = /^(\d+(?:\.\d+)?)?-(\d+(?:\.\d+)?)?$/;

const valueSchema = z.string().trim().min(1).max(100);

/** `?size=S&size=M` приходит массивом, одиночное — строкой. Битые значения отбрасываются, а не роняют страницу */
const valuesSchema = z
  .preprocess((value) => (value === undefined ? [] : [value].flat()), z.array(z.unknown()))
  .catch([])
  .transform((values) => {
    const valid = values.flatMap((value) => {
      const parsed = valueSchema.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    });
    return Array.from(new Set(valid)).slice(0, MAX_VALUES);
  });

/** `1000-5000`, `-5000`, `1000-` → границы. Пустой или битый — undefined */
export function parseRange(value: string | undefined): FilterRange | undefined {
  const match = value?.match(RANGE_PATTERN);
  if (!match || (!match[1] && !match[2])) return undefined;
  const min = match[1] ? Number(match[1]) : undefined;
  const max = match[2] ? Number(match[2]) : undefined;
  return min !== undefined && max !== undefined && min > max ? { min: max, max: min } : { min, max };
}

export function formatRange({ min, max }: FilterRange): string {
  return `${min ?? ""}-${max ?? ""}`;
}

/** Фильтры из URL по конфигу. Radio — только первое значение, range — первая корректная пара */
export function parseFilters(searchParams: Record<string, string | string[] | undefined>, filters: readonly CatalogFilter[]): FilterState {
  const state: FilterState = {};
  for (const filter of filters) {
    const values = valuesSchema.parse(searchParams[filter.key]);
    if (filter.type === "range") {
      const range = values.map(parseRange).find(Boolean);
      if (range) state[filter.key] = [formatRange(range)];
    } else if (values.length) {
      state[filter.key] = filter.type === "radio" ? values.slice(0, 1) : values;
    }
  }
  return state;
}

/** Параметры адреса: в порядке конфига, пустые фильтры не попадают */
export function filterSearchParams(state: FilterState, order: FilterOrder): [string, string][] {
  return order.flatMap(({ key }) => (state[key] ?? []).map((value): [string, string] => [key, value]));
}

/** Сколько значений выбрано: число на кнопке «Фильтры» */
export function countActive(state: FilterState): number {
  return Object.values(state).reduce((sum, values) => sum + values.length, 0);
}

const sourceField = (source: CatalogFilterSource) => ("option" in source ? "option_values" : source.field);

/** Опции в индексе — одним полем `Название:значение` (backend/src/search/helpers/option-values.ts) */
const toIndexValue = (source: CatalogFilterSource, value: string) => ("option" in source ? `${source.option}:${value}` : value);

/**
 * Условия и фасеты для поискового индекса. Значения одного фильтра — через «или», разные фильтры — через «и».
 * Все опции товара лежат в одном поле индекса, поэтому счётчики опций не учитывают выбор в соседних опциях.
 */
export function filterQuery(
  filters: readonly CatalogFilter[],
  state: FilterState,
  { priceField }: FilterIndexContext,
): { clauses: Record<string, unknown>[]; facets: SearchFacetRequest[] } {
  const clauses: Record<string, unknown>[] = [];
  const valueFields = new Set<string>();
  let statsField: string | undefined;

  for (const filter of filters) {
    const values = state[filter.key] ?? [];
    if (filter.type === "range") {
      if (!priceField) continue;
      statsField = priceField;
      const range = parseRange(values[0]);
      if (range) {
        clauses.push({
          [priceField]: { ...(range.min !== undefined && { $gte: range.min }), ...(range.max !== undefined && { $lte: range.max }) },
        });
      }
      continue;
    }
    const field = sourceField(filter.source);
    valueFields.add(field);
    if (values.length) clauses.push({ [field]: { $in: values.map((value) => toIndexValue(filter.source, value)) } });
  }

  return {
    clauses,
    facets: [
      ...Array.from(valueFields, (field) => ({ field, limit: 200 })),
      ...(statsField ? [{ field: statsField, type: "stats" }] : []),
    ],
  };
}

/** Значения фильтра-списка из фасета: сначала в порядке подписей конфига, остальные — как отдал индекс */
function listOptions(filter: Exclude<CatalogFilter, { type: "range" }>, selected: string[], facets: ProductFacets): FilterOption[] {
  const facet = facets[sourceField(filter.source)];
  const prefix = "option" in filter.source ? `${filter.source.option}:` : "";
  const counts = new Map<string, number>();
  if (facet?.type === "value") {
    for (const { value, count } of facet.values) {
      if (value.startsWith(prefix)) counts.set(value.slice(prefix.length), count);
    }
  }
  // Выбранное значение, которого нет в выдаче, остаётся в списке — иначе его не снять
  for (const value of selected) if (!counts.has(value)) counts.set(value, 0);

  const swatches = filter.type === "color" ? filter.swatches : undefined;
  const preferred = Object.keys({ ...filter.labels, ...swatches });
  const rank = (value: string) => (preferred.includes(value) ? preferred.indexOf(value) : preferred.length);
  // sort стабилен: внутри одного ранга остаётся порядок индекса
  return Array.from(counts.keys())
    .sort((a, b) => rank(a) - rank(b))
    .map((value) => ({
      value,
      label: filter.labels?.[value] ?? value,
      count: counts.get(value) ?? 0,
      ...(swatches?.[value] && { color: swatches[value] }),
    }));
}

/** Секции шторки по конфигу и фасетам выдачи. Секция без значений (и слайдер без разброса цен) скрыта */
export function filterGroups(
  filters: readonly CatalogFilter[],
  state: FilterState,
  facets: ProductFacets,
  { priceField, currencyCode }: FilterIndexContext,
): FilterGroup[] {
  return filters.flatMap((filter): FilterGroup[] => {
    const { key, label } = filter;
    if (filter.type === "range") {
      const stats = priceField ? facets[priceField] : undefined;
      if (stats?.type !== "stats") return [];
      const step = filter.step ?? 1;
      const min = Math.floor(stats.min / step) * step;
      const max = Math.ceil(stats.max / step) * step;
      return min < max ? [{ type: "range", key, label, min, max, step, currencyCode }] : [];
    }
    const options = listOptions(filter, state[key] ?? [], facets);
    return options.length ? [{ type: filter.type, key, label, options }] : [];
  });
}

/** Значения слайдера: выбранные границы внутри доступных, без выбора — весь разброс */
export function rangeValue(group: Extract<FilterGroup, { type: "range" }>, value: string | undefined): [number, number] {
  const range = parseRange(value);
  const clamp = (n: number) => Math.min(Math.max(n, group.min), group.max);
  return [clamp(range?.min ?? group.min), clamp(range?.max ?? group.max)];
}

/** Слайдер → значение в URL. Весь разброс — фильтра нет; крайняя граница — без ограничения с этой стороны */
export function toRangeValue(group: Extract<FilterGroup, { type: "range" }>, [min, max]: [number, number]): string | undefined {
  if (min <= group.min && max >= group.max) return undefined;
  return formatRange({ min: min > group.min ? min : undefined, max: max < group.max ? max : undefined });
}

/** Подпись границы слайдера: цена — в валюте, иначе число */
export function formatRangeValue(group: Extract<FilterGroup, { type: "range" }>, value: number): string {
  return group.currencyCode ? formatPrice(value, group.currencyCode) : String(value);
}

/** Добавляет параметры к адресу, в котором уже может быть `?sort=` */
export function appendSearchParams(href: string, params: [string, string][]): string {
  if (!params.length) return href;
  const query = new URLSearchParams(params).toString();
  return `${href}${href.includes("?") ? "&" : "?"}${query}`;
}
