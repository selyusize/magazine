import { useId, type ReactNode } from "react";

import { ReviewItem, ReviewSummaryView, type Review } from "@entities/review";
import { cn } from "@shared/lib/utils";
import { Container } from "@shared/ui/container";

export type ProductReviewsViewProps = {
  /** id секции — якорь для ссылок пагинации (`#reviews`) */
  id?: string;
  title: string;
  titleHidden?: boolean;
  /** Сводка: средняя оценка и «На основе 14 отзывов». Нет отзывов — не передаётся */
  summary?: { average: number; countLabel: string };
  /** Отзывы страницы с готовыми датами */
  items: (Review & { date: string })[];
  verifiedLabel: string;
  emptyText: string;
  /** Пагинация под списком */
  pagination?: ReactNode;
  className?: string;
};

/**
 * Отзывы о товаре (Figma: Product detail — Reviews): средняя оценка, список с чертами между отзывами, пагинация.
 * Всё в HTML с сервера; заголовки отзывов — h3 под h2 секции.
 */
export function ProductReviewsView({
  id = "reviews",
  title,
  titleHidden,
  summary,
  items,
  verifiedLabel,
  emptyText,
  pagination,
  className,
}: ProductReviewsViewProps) {
  const titleId = useId();

  return (
    // scroll-mt — переход по якорю не прячет начало блока под липким хедером
    <section id={id} aria-labelledby={titleId} data-widget="product-reviews" className={cn("scroll-mt-(--sticky-header-height,0px)", className)}>
      <Container className="flex flex-col gap-10 py-14 md:gap-14 md:py-16">
        <div className="flex flex-col gap-4">
          <h2 id={titleId} className={titleHidden ? "sr-only" : "text-700"}>
            {title}
          </h2>
          {summary ? <ReviewSummaryView average={summary.average} countLabel={summary.countLabel} /> : null}
        </div>
        {items.length ? (
          <ul className="flex flex-col">
            {items.map(({ date, ...review }) => (
              <li key={review.id} className="border-b border-border py-8 first:pt-0">
                <ReviewItem {...review} date={date} verifiedLabel={verifiedLabel} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-300 text-muted-foreground">{emptyText}</p>
        )}
        {pagination}
      </Container>
    </section>
  );
}
