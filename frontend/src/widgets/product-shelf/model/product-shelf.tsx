import type { ReactNode } from "react";

import { toCardProps, type ProductCardData } from "@entities/product";

import { ProductShelfView, type ProductShelfLayout } from "../ui/product-shelf-view";
import { productShelfMock } from "./products.mock";

export type ProductShelfProps = {
  items?: ProductCardData[];
  /** Заголовок секции. `null` — без заголовка */
  title?: ReactNode;
  layout?: ProductShelfLayout;
  className?: string;
};

/**
 * Связка: товары (пока мок) + «тупое» представление из ui. Цены форматируются здесь.
 *
 * @example Подборка из каталога
 * <ProductShelf title="Новинки" items={newArrivals} />
 */
export function ProductShelf({ items = productShelfMock.items, title = productShelfMock.title, layout, className }: ProductShelfProps) {
  if (items.length === 0) return null;

  return <ProductShelfView items={items.map(toCardProps)} title={title} layout={layout} className={className} />;
}
