import type { ReactNode } from "react";

import { cn } from "@shared/lib/utils";

import type { ProductCardItem } from "../model/to-card-props";
import { ProductCard } from "./product-card";

/** Колонок с lg; до lg всегда две */
export type ProductGridColumns = 2 | 3 | 4 | 5 | 6;

const columnClasses: Record<ProductGridColumns, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

/** Подсказка браузеру о ширине фото — по числу колонок */
const sizesFor = (columns: ProductGridColumns) => `(min-width: 64rem) ${Math.round(100 / columns)}vw, 50vw`;

export type ProductGridProps = {
  items: ProductCardItem[];
  columns?: ProductGridColumns;
  /** Кнопка «В избранное» на фото карточки */
  favorite?: (item: ProductCardItem) => ReactNode;
  /** Пропорции фото карточек (см. ProductCard) */
  imageClassName?: string;
  /** Отступы между карточками */
  className?: string;
};

/** Сетка карточек товара: каталог, результаты поиска. */
export function ProductGrid({ items, columns = 4, favorite, imageClassName, className }: ProductGridProps) {
  return (
    <ul data-slot="product-grid" className={cn("grid grid-cols-2", columnClasses[columns], className)}>
      {items.map((item) => {
        const { id, ...card } = item;
        return (
          <li key={id}>
            <ProductCard {...card} sizes={sizesFor(columns)} favorite={favorite?.(item)} imageClassName={imageClassName} />
          </li>
        );
      })}
    </ul>
  );
}
