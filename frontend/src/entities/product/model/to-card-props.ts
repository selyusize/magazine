import { formatPrice } from "@shared/lib/format-price";

import type { ProductCardData } from "./types";

/** Данные товара → пропсы карточки (без sizes — он зависит от сетки списка). Цена форматируется здесь. */
export function toCardProps({ price, ...item }: ProductCardData) {
  return { ...item, price: price && formatPrice(price.amount, price.currencyCode) };
}

export type ProductCardItem = ReturnType<typeof toCardProps>;
