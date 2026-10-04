import { toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCategoryOptions } from "../../crud/hooks/use-category-options";
import { useProductShop } from "../../shops/hooks/use-product-shop";
import {
  useBrandOptions,
  useProductCatalog,
  useSaveProductCatalog,
} from "./product-catalog-api";

/** В Select нельзя выбрать пустое значение — «не выбрано» кодируем отдельным ключом. */
export const NONE = "__none";

/** Блок «Каталог» карточки товара: бренд и основная категория из магазина товара, сохранение одной кнопкой. */
export function useProductCatalogForm(productId: string) {
  const { t } = useTranslation();
  const shop = useProductShop(productId);
  const shopId = shop.data?.id ?? null;
  const catalog = useProductCatalog(productId, shopId);
  const brands = useBrandOptions(shopId);
  const categories = useCategoryOptions(true, shopId);
  const save = useSaveProductCatalog(productId, shopId);

  const [brandId, setBrandId] = useState(NONE);
  const [mainCategoryId, setMainCategoryId] = useState(NONE);

  useEffect(() => {
    if (!catalog.data) return;
    setBrandId(catalog.data.brand?.id ?? NONE);
    setMainCategoryId(catalog.data.main_category?.id ?? NONE);
  }, [catalog.data]);

  const savedBrand = catalog.data?.brand?.id ?? NONE;
  const savedCategory = catalog.data?.main_category?.id ?? NONE;
  const isDirty = brandId !== savedBrand || mainCategoryId !== savedCategory;

  // Категории товара — первыми: основную обычно выбирают из них
  const productCategoryIds = new Set(
    (catalog.data?.categories ?? []).map((category) => category.id),
  );
  const categoryOptions = [...(categories.data ?? [])].sort(
    (a, b) =>
      Number(productCategoryIds.has(b.id)) -
      Number(productCategoryIds.has(a.id)),
  );

  const submit = () =>
    save.mutate(
      {
        brand_id: brandId === NONE ? null : brandId,
        main_category_id: mainCategoryId === NONE ? null : mainCategoryId,
      },
      {
        onSuccess: () => toast.success(t("productCatalog.saved")),
        onError: (error) => toast.error(error.message),
      },
    );

  return {
    isLoading: shop.isLoading || catalog.isLoading,
    error: shop.error ?? catalog.error,
    brands: brands.data ?? [],
    categories: categoryOptions,
    productCategoryIds,
    brandId,
    setBrandId,
    mainCategoryId,
    setMainCategoryId,
    canSave: isDirty && !save.isPending,
    isSaving: save.isPending,
    submit,
  };
}
