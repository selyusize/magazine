import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminFetch } from "../../lib/admin-fetch";

/** Предложение в карточке товара — `GET /admin/products/:id/supplier-offers`. */
export type ProductSupplierOffer = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_is_active: boolean;
  variant_id: string;
  variant_title: string;
  external_id: string;
  sku: string | null;
  barcode: string | null;
  purchase_price: number | null;
  quantity: number;
  synced_at: string | null;
};

/** Поля выгрузки — меняются и вручную. */
export type SupplierOfferFields = {
  external_id: string;
  sku: string | null;
  barcode: string | null;
  purchase_price: number | null;
  quantity: number;
};

export type SupplierOfferInput =
  | {
      id: null;
      supplier_id: string;
      variant_id: string;
      fields: SupplierOfferFields;
    }
  | { id: string; fields: SupplierOfferFields };

type SupplierOption = { id: string; name: string; is_active: boolean };

const offersKey = (productId: string) =>
  ["admin-product-supplier-offers", productId] as const;

export function useProductSupplierOffers(productId: string) {
  return useQuery({
    queryKey: offersKey(productId),
    queryFn: () =>
      adminFetch<{ supplier_offers: ProductSupplierOffer[] }>(
        `/admin/products/${productId}/supplier-offers`,
      ),
    select: (data) => data.supplier_offers,
  });
}

/** Поставщики для выбора. Их единицы-десятки — первой сотни хватает. */
export function useSupplierOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-supplier-options"],
    queryFn: () =>
      adminFetch<{ suppliers: SupplierOption[] }>("/admin/suppliers", {
        query: { limit: 100 },
      }),
    select: (data) => data.suppliers,
    enabled,
  });
}

function useOffersMutation<TInput>(
  productId: string,
  mutationFn: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offersKey(productId) }),
  });
}

export const useSaveSupplierOffer = (productId: string) =>
  useOffersMutation(productId, (input: SupplierOfferInput) =>
    input.id !== null
      ? adminFetch(`/admin/supplier-offers/${input.id}`, {
          method: "POST",
          body: input.fields,
        })
      : adminFetch("/admin/supplier-offers", {
          method: "POST",
          body: {
            supplier_id: input.supplier_id,
            variant_id: input.variant_id,
            ...input.fields,
          },
        }),
  );

export const useDeleteSupplierOffer = (productId: string) =>
  useOffersMutation(productId, (id: string) =>
    adminFetch(`/admin/supplier-offers/${id}`, { method: "DELETE" }),
  );
