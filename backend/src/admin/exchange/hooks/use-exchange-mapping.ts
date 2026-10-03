import { toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { useCategoryOptions } from "../../crud/hooks/use-category-options";
import {
  useAttributeOptions,
  useExchangeGroups,
  useExchangeProperties,
  useMapExchangeGroup,
  useMapExchangeProperty,
} from "./exchange-api";

/** «Не сопоставлено» в выпадающем списке: Select не принимает пустое значение. */
export const NONE = "__none__";

export const toMapping = (value: string) => (value === NONE ? null : value);

/** Группы поставщика → категории магазина. Сохраняется сразу при выборе, применится при следующем импорте. */
export function useGroupMapping(supplierId: string) {
  const { t } = useTranslation();
  const groups = useExchangeGroups(supplierId);
  const categories = useCategoryOptions(true);
  const map = useMapExchangeGroup();

  return {
    groups: groups.data ?? [],
    categories: categories.data ?? [],
    isLoading: groups.isLoading,
    error: groups.error ?? categories.error,
    setCategory: (id: string, value: string) =>
      map.mutate(
        { id, category_id: toMapping(value) },
        {
          onSuccess: () => toast.success(t("exchange.mapping.saved")),
          onError: (error) => toast.error(error.message),
        },
      ),
  };
}

/** Свойства поставщика → характеристики магазина. Без характеристики значения уходят в metadata товара. */
export function usePropertyMapping(supplierId: string) {
  const { t } = useTranslation();
  const properties = useExchangeProperties(supplierId);
  const attributes = useAttributeOptions();
  const map = useMapExchangeProperty();

  return {
    properties: properties.data ?? [],
    attributes: attributes.data ?? [],
    isLoading: properties.isLoading,
    error: properties.error ?? attributes.error,
    setAttribute: (id: string, value: string) =>
      map.mutate(
        { id, attribute_id: toMapping(value) },
        {
          onSuccess: () => toast.success(t("exchange.mapping.saved")),
          onError: (error) => toast.error(error.message),
        },
      ),
  };
}
