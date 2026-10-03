import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AttributeType } from "../../attributes/types";
import { sdk } from "../../lib/sdk";

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

/** Справочник характеристик в порядке таблицы на карточке. Сотни хватает; больше — понадобятся группы. */
export function useAttributes() {
  return useQuery({
    queryKey: ["admin-attributes-all"],
    queryFn: () =>
      sdk.client.fetch<{ attributes: Attribute[] }>("/admin/attributes", {
        query: { limit: 100 },
      }),
    select: (data) => data.attributes,
  });
}

export function useProductAttributeValues(productId: string) {
  return useQuery({
    queryKey: valuesKey(productId),
    queryFn: () =>
      sdk.client.fetch<{ attribute_values: AttributeValue[] }>(
        `/admin/products/${productId}/attributes`,
      ),
    select: (data) => data.attribute_values,
  });
}

/** Значения уровня товара целиком; значения вариантов (из импорта) не трогаются. */
export function useSaveProductAttributeValues(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { attribute_id: string; value: string }[]) =>
      sdk.client.fetch<{ attribute_values: AttributeValue[] }>(
        `/admin/products/${productId}/attributes`,
        { method: "POST", body: { variant_id: null, values } },
      ),
    onSuccess: (data) => queryClient.setQueryData(valuesKey(productId), data),
  });
}
