import { toast } from "@medusajs/ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  toAttributeFormValues,
  toAttributeValuesBody,
} from "./attribute-form-values";
import { useProductShop } from "../../shops/hooks/use-product-shop";
import {
  useAttributes,
  useProductAttributeValues,
  useSaveProductAttributeValues,
} from "./product-attributes-api";

/** Блок «Характеристики» карточки товара: по полю на характеристику магазина товара, сохранение заменяет значения товара целиком. */
export function useProductAttributesForm(productId: string) {
  const { t } = useTranslation();
  const shop = useProductShop(productId);
  const shopId = shop.data?.id ?? null;
  const attributes = useAttributes(shopId);
  const values = useProductAttributeValues(productId, shopId);
  const save = useSaveProductAttributeValues(productId, shopId);

  const saved = useMemo(
    () =>
      attributes.data && values.data
        ? toAttributeFormValues(attributes.data, values.data)
        : null,
    [attributes.data, values.data],
  );
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (saved) setForm(saved);
  }, [saved]);

  const isDirty =
    !!saved && Object.keys(saved).some((id) => (form[id] ?? "") !== saved[id]);

  const submit = () =>
    save.mutate(toAttributeValuesBody(attributes.data ?? [], form), {
      onSuccess: () => toast.success(t("productAttributes.saved")),
      onError: (error) => toast.error(error.message),
    });

  return {
    isLoading: shop.isLoading || attributes.isLoading || values.isLoading,
    error: shop.error ?? attributes.error ?? values.error,
    attributes: attributes.data ?? [],
    form,
    setValue: (attributeId: string, value: string) =>
      setForm((current) => ({ ...current, [attributeId]: value })),
    canSave: isDirty && !save.isPending,
    isSaving: save.isPending,
    submit,
  };
}
