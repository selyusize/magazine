import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminFetch } from "../../lib/admin-fetch";
import { useProductShop } from "../../shops/hooks/use-product-shop";

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

/** Предложения и поставщики — в магазине товара; пока он не известен, запросы ждут. */
const useShopId = (productId: string): string | null =>
  useProductShop(productId).data?.id ?? null;

export function useProductSupplierOffers(productId: string) {
  const shopId = useShopId(productId);
  return useQuery({
    queryKey: offersKey(productId),
    queryFn: () =>
      adminFetch<{ supplier_offers: ProductSupplierOffer[] }>(
        `/admin/products/${productId}/supplier-offers`,
        {},
        shopId,
      ),
    select: (data) => data.supplier_offers,
    enabled: shopId !== null,
  });
}

/** Поставщики магазина товара. Их единицы-десятки — первой сотни хватает. */
export function useSupplierOptions(productId: string, enabled: boolean) {
  const shopId = useShopId(productId);
  return useQuery({
    queryKey: ["admin-supplier-options", shopId],
    queryFn: () =>
      adminFetch<{ suppliers: SupplierOption[] }>(
        "/admin/suppliers",
        { query: { limit: 100 } },
        shopId,
      ),
    select: (data) => data.suppliers,
    enabled: enabled && shopId !== null,
  });
}

function useOffersMutation<TInput>(
  productId: string,
  request: (input: TInput, shopId: string | null) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const shopId = useShopId(productId);
  return useMutation({
    mutationFn: (input: TInput) => request(input, shopId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offersKey(productId) }),
  });
}

export const useSaveSupplierOffer = (productId: string) =>
  useOffersMutation(productId, (input: SupplierOfferInput, shopId) =>
    input.id !== null
      ? adminFetch(
          `/admin/supplier-offers/${input.id}`,
          { method: "POST", body: input.fields },
          shopId,
        )
      : adminFetch(
          "/admin/supplier-offers",
          {
            method: "POST",
            body: {
              supplier_id: input.supplier_id,
              variant_id: input.variant_id,
              ...input.fields,
            },
          },
          shopId,
        ),
  );

export const useDeleteSupplierOffer = (productId: string) =>
  useOffersMutation(productId, (id: string, shopId) =>
    adminFetch(`/admin/supplier-offers/${id}`, { method: "DELETE" }, shopId),
  );
