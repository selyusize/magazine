"use client";

import {
  firstMissingOption,
  initialSelection,
  selectionImages,
  selectionPrice,
  useVariantSelection,
  type ProductDetail,
} from "@entities/product";
import { toPickerGroups } from "@features/variant-picker";
import type { ProductPageConfig } from "@shared/config";
import { formatPrice } from "@shared/lib/format-price";

/**
 * Состояние страницы товара: выбор опций → группы выбора, цена, фото выбранного цвета и кнопка покупки.
 * Начальный выбор считается одинаково на сервере и в браузере — HTML с сервера уже с ценой и фото варианта.
 */
export function useProductOverview(product: ProductDetail, config: ProductPageConfig, initialVariantId?: string) {
  const preselect = config.options.filter((option) => option.preselect).map((option) => option.option);
  const { selection, variant, select } = useVariantSelection(
    product,
    initialSelection(product, { variantId: initialVariantId, preselect }),
  );

  const groups = toPickerGroups(product, selection, config.options);
  const priced = selectionPrice(product, selection);
  const original = priced?.price.originalAmount;
  const format = (amount: number) => formatPrice(amount, priced?.price.currencyCode ?? "");

  const missing = firstMissingOption(product, selection);
  const missingLabel = groups.find((group) => group.option === missing)?.label ?? missing;
  const buyable = Boolean(variant?.inStock && variant.price);
  const { cart } = config;

  return {
    selection,
    groups,
    onSelect: select,
    images: selectionImages(product, selection),
    price: priced && {
      price: priced.from ? config.priceFromLabel.replace("{price}", format(priced.price.amount)) : format(priced.price.amount),
      // Скидка — только у выбранной цены, не у «от …»: иначе непонятно, к какому варианту она относится
      originalPrice: original && !priced.from ? format(original) : undefined,
      discount: original && !priced.from ? `−${Math.round((1 - priced.price.amount / original) * 100)}%` : undefined,
    },
    summary: config.summary === "description" ? product.description : config.summary === "subtitle" && product.subtitle ? [product.subtitle] : [],
    buy: {
      variantId: buyable ? variant?.id : undefined,
      label: buyable
        ? cart.addLabel
        : !variant && missingLabel
          ? cart.selectLabel.replace("{option}", missingLabel.toLocaleLowerCase())
          : cart.soldOutLabel,
    },
  };
}
