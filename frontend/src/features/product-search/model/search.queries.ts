import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import { listProducts } from "@entities/product";

export const productSearchKeys = {
  all: ["product-search"] as const,
  list: (q: string, limit: number) => [...productSearchKeys.all, q, limit] as const,
};

/** Для useQuery и для prefetch на сервере (HydrationBoundary). */
export const productSearchQueryOptions = (q: string, limit: number) =>
  queryOptions({
    queryKey: productSearchKeys.list(q, limit),
    queryFn: () => listProducts({ q, limit }),
    staleTime: 60_000,
  });

/** Результаты на лету. Пока идёт новый запрос, показываются прошлые — сетка не «мигает» при вводе. */
export function useProductSearch(q: string, limit: number, enabled: boolean) {
  return useQuery({ ...productSearchQueryOptions(q, limit), enabled, placeholderData: keepPreviousData });
}
