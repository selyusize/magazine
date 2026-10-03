import type { ReactNode } from "react";

import { cn } from "@shared/lib/utils";

export type ProductOverviewViewProps = {
  /** Галерея фото — левая колонка (на мобильных — сверху) */
  gallery: ReactNode;
  /** h1 страницы */
  title: string;
  /** Цена: ProductPrice */
  price?: ReactNode;
  /** Короткое описание под ценой, абзацами */
  summary?: string[];
  /** Кнопки рядом с названием: избранное, поделиться */
  actions?: ReactNode;
  /** Выбор опций */
  picker?: ReactNode;
  /** Кнопка покупки и всё, что рядом с ней (количество, «купить в 1 клик») */
  buy?: ReactNode;
  /** Раскрывающиеся блоки под кнопкой */
  details?: ReactNode;
  /** Колонка покупки прилипает при прокрутке (галерея-столбик на десктопе) */
  sticky?: boolean;
  className?: string;
};

/**
 * Раскладка первого экрана товара (Figma: Product detail): галерея слева, колонка покупки справа.
 * Регионы приходят готовыми — здесь только их места. Пустой регион не занимает место.
 */
export function ProductOverviewView({
  gallery,
  title,
  price,
  summary = [],
  actions,
  picker,
  buy,
  details,
  sticky,
  className,
}: ProductOverviewViewProps) {
  return (
    <div
      data-slot="product-overview"
      className={cn(
        "grid gap-8 lg:grid-cols-[minmax(0,49rem)_minmax(16rem,18.5rem)] lg:items-start lg:justify-center lg:gap-x-12.5",
        className,
      )}
    >
      {/* На мобильных фото во всю ширину экрана */}
      <div className="-mx-(--container-gutter) md:mx-0">{gallery}</div>
      {/* Прилипает под липким хедером: его высоту пишет StickyHeaderOffset в --sticky-header-height */}
      <div className={cn("flex min-w-0 flex-col gap-7.5", sticky && "lg:sticky lg:top-[calc(var(--sticky-header-height,0px)+2rem)]")}>
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-600">{title}</h1>
            {actions ? <div className="flex shrink-0 items-center gap-3 pt-0.5">{actions}</div> : null}
          </div>
          {price}
        </div>
        {summary.length ? (
          <div className="flex flex-col gap-3 text-300">
            {summary.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : null}
        {picker}
        {buy}
        {details}
      </div>
    </div>
  );
}
