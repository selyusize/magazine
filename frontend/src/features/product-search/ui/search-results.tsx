import Link from "next/link";
import type { ReactNode } from "react";

import { ProductGrid, type ProductCardItem, type ProductGridColumns } from "@entities/product";
import { cn } from "@shared/lib/utils";

/** Колонок с lg; до lg всегда две */
export type SearchResultsColumns = ProductGridColumns;

export type SearchResultsProps = {
  items: ProductCardItem[];
  /** Подпись слева над сеткой: «13 товаров» */
  summary: ReactNode;
  /** h2 — на странице поиска (структура заголовков), p — в панели */
  summaryAs?: "p" | "h2";
  /** Ссылка справа над сеткой: «Смотреть все» → страница поиска */
  viewAll?: { label: string; href: string };
  columns?: SearchResultsColumns;
  /** Под сеткой: пагинация, «Показать ещё» */
  footer?: ReactNode;
  className?: string;
};

/** Результаты поиска (Figma: Search results): число и ссылка над чертой, ниже — сетка карточек товара. */
export function SearchResults({
  items,
  summary,
  summaryAs: Summary = "p",
  viewAll,
  columns = 4,
  footer,
  className,
}: SearchResultsProps) {
  return (
    <div data-slot="search-results" className={cn("flex flex-col gap-8.5", className)}>
      <SearchResultsBar
        start={<Summary className="text-200 text-muted-foreground">{summary}</Summary>}
        end={
          viewAll ? (
            <Link href={viewAll.href} className="text-200 text-muted-foreground hover:text-foreground hover:underline">
              {viewAll.label}
            </Link>
          ) : null
        }
      />
      <ProductGrid items={items} columns={columns} className="gap-x-4 gap-y-2 md:gap-x-6" />
      {footer}
    </div>
  );
}

/** Строка над сеткой с чертой снизу */
function SearchResultsBar({ start, end }: { start: ReactNode; end?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2.75">
      {start}
      {end}
    </div>
  );
}

/** Нет результатов / ошибка: текст под чертой */
export function SearchResultsMessage({ children }: { children: ReactNode }) {
  return (
    <p data-slot="search-results-message" className="border-t border-border pt-4 text-300 text-muted-foreground">
      {children}
    </p>
  );
}
