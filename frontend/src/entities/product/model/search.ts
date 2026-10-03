import { camelToSnake, type SearchOptionsFacetsItem } from "@shared/api";
import { z } from "@shared/lib/zod";

/** Какой фасет посчитать: `{ field: "option_values", limit: 200 }`, `{ field: "min_price_rub", type: "stats" }` */
export type SearchFacetRequest = SearchOptionsFacetsItem;

/** Значение фасета и сколько товаров выдачи его имеют */
export type FacetValue = { value: string; count: number };

/** Фасет индекса: значения со счётчиками или границы числового поля */
export type ProductFacet = { type: "value"; values: FacetValue[] } | { type: "stats"; min: number; max: number };

/** Фасеты выдачи по полю индекса: `option_values`, `min_price_rub` */
export type ProductFacets = Record<string, ProductFacet>;

const facetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("value"),
    values: z.array(z.object({ value: z.string(), count: z.number() })),
  }),
  // У пустой выдачи границ нет — такой фасет отбрасывается
  z.object({ type: z.literal("stats"), min: z.number(), max: z.number() }),
]);

/**
 * Фасеты из ответа /store/search. Ключи клиент API переводит в camelCase (`minPriceEur`) — возвращаем имена полей
 * индекса. Неизвестный или пустой фасет пропускается, а не роняет страницу.
 */
export function toProductFacets(raw: unknown): ProductFacets {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw).flatMap(([key, value]) => {
      const facet = facetSchema.safeParse(value);
      return facet.success ? [[camelToSnake(key), facet.data]] : [];
    }),
  );
}

/** Сортировка из конфига (`-created_at`, `title`) → сортировка индекса (`{ created_at: "DESC" }`) */
export function toSearchOrder(order: string | undefined): Record<string, "ASC" | "DESC"> | undefined {
  if (!order) return undefined;
  return order.startsWith("-") ? { [order.slice(1)]: "DESC" } : { [order]: "ASC" };
}
