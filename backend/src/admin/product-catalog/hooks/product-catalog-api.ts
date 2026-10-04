import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminFetch } from "../../lib/admin-fetch";

type Named = { id: string; name: string; handle: string };

export type ProductCatalog = {
  product_id: string;
  brand: Named | null;
  main_category: Named | null;
  categories: Named[];
};

export type ProductCatalogInput = {
  brand_id: string | null;
  main_category_id: string | null;
};

const catalogKey = (productId: string) =>
  ["admin-product-catalog", productId] as const;

/** Запросы блока — в магазине товара (`shopId`); пока он не известен, блок ждёт. */
export function useProductCatalog(productId: string, shopId: string | null) {
  return useQuery({
    queryKey: catalogKey(productId),
    queryFn: () =>
      adminFetch<{ catalog: ProductCatalog }>(
        `/admin/products/${productId}/catalog`,
        {},
        shopId,
      ),
    select: (data) => data.catalog,
    enabled: shopId !== null,
  });
}

/** Бренды магазина товара. Справочник небольшой — первой сотни хватает; поиск появится, если станет тесно. */
export function useBrandOptions(shopId: string | null) {
  return useQuery({
    queryKey: ["admin-product-catalog-brands", shopId],
    queryFn: () =>
      adminFetch<{ brands: Named[] }>(
        "/admin/brands",
        { query: { limit: 100 } },
        shopId,
      ),
    select: (data) => data.brands,
    enabled: shopId !== null,
  });
}

export function useSaveProductCatalog(productId: string, shopId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductCatalogInput) =>
      adminFetch<{ catalog: ProductCatalog }>(
        `/admin/products/${productId}/catalog`,
        { method: "POST", body },
        shopId,
      ),
    onSuccess: (data) => queryClient.setQueryData(catalogKey(productId), data),
  });
}
