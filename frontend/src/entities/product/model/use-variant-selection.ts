"use client";

import { useEffect, useState } from "react";

import { PRODUCT_VARIANT_PARAM } from "@shared/config";

import type { OptionSelection, ProductDetail } from "./types";
import { findVariant, selectOptionValue } from "./variants";

/**
 * Выбор опций товара. Выбранный вариант попадает в адрес (`?variant=`) без перезагрузки и без новой записи в истории:
 * ссылкой можно поделиться, а «назад» ведёт туда, откуда пришли. Каноническая страница — без параметра.
 */
export function useVariantSelection(product: ProductDetail, initial: OptionSelection, { syncUrl = true } = {}) {
  const [selection, setSelection] = useState(initial);
  const variant = findVariant(product, selection);
  const variantId = variant?.id;

  useEffect(() => {
    if (!syncUrl) return;
    const url = new URL(window.location.href);
    if (variantId) url.searchParams.set(PRODUCT_VARIANT_PARAM, variantId);
    else url.searchParams.delete(PRODUCT_VARIANT_PARAM);
    if (url.href !== window.location.href) window.history.replaceState(null, "", url);
  }, [variantId, syncUrl]);

  return {
    selection,
    variant,
    select: (option: string, value: string) => setSelection((current) => selectOptionValue(product, current, option, value)),
  };
}
