import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { sdk } from "../../lib/sdk";

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

export function useProductCatalog(productId: string) {
  return useQuery({
    queryKey: catalogKey(productId),
    queryFn: () =>
      sdk.client.fetch<{ catalog: ProductCatalog }>(
        `/admin/products/${productId}/catalog`,
      ),
    select: (data) => data.catalog,
  });
}

/** Бренды для выбора. Справочник небольшой — первой сотни хватает; поиск появится, если станет тесно. */
export function useBrandOptions() {
  return useQuery({
    queryKey: ["admin-product-catalog-brands"],
    queryFn: () =>
      sdk.client.fetch<{ brands: Named[] }>("/admin/brands", {
        query: { limit: 100 },
      }),
    select: (data) => data.brands,
  });
}

export function useSaveProductCatalog(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductCatalogInput) =>
      sdk.client.fetch<{ catalog: ProductCatalog }>(
        `/admin/products/${productId}/catalog`,
        { method: "POST", body },
      ),
    onSuccess: (data) => queryClient.setQueryData(catalogKey(productId), data),
  });
}
