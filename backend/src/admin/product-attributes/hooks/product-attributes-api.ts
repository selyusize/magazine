import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AttributeType } from "../../attributes/types";
import { adminFetch } from "../../lib/admin-fetch";

export type Attribute = {
  id: string;
  name: string;
  handle: string;
  type: AttributeType;
  unit: string | null;
};

export type AttributeValue = {
  id: string;
  attribute_id: string;
  variant_id: string | null;
  value: string;
};

const valuesKey = (productId: string) =>
  ["admin-product-attribute-values", productId] as const;

/**
 * Характеристики магазина товара (`shopId`) в порядке таблицы на карточке. Сотни хватает; больше — понадобятся
 * группы.
 */
export function useAttributes(shopId: string | null) {
  return useQuery({
    queryKey: ["admin-attributes-all", shopId],
    queryFn: () =>
      adminFetch<{ attributes: Attribute[] }>(
        "/admin/attributes",
        { query: { limit: 100 } },
        shopId,
      ),
    select: (data) => data.attributes,
    enabled: shopId !== null,
  });
}

export function useProductAttributeValues(
  productId: string,
  shopId: string | null,
) {
  return useQuery({
    queryKey: valuesKey(productId),
    queryFn: () =>
      adminFetch<{ attribute_values: AttributeValue[] }>(
        `/admin/products/${productId}/attributes`,
        {},
        shopId,
      ),
    select: (data) => data.attribute_values,
    enabled: shopId !== null,
  });
}

/** Значения уровня товара целиком; значения вариантов (из импорта) не трогаются. */
export function useSaveProductAttributeValues(
  productId: string,
  shopId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { attribute_id: string; value: string }[]) =>
      adminFetch<{ attribute_values: AttributeValue[] }>(
        `/admin/products/${productId}/attributes`,
        { method: "POST", body: { variant_id: null, values } },
        shopId,
      ),
    onSuccess: (data) => queryClient.setQueryData(valuesKey(productId), data),
  });
}
