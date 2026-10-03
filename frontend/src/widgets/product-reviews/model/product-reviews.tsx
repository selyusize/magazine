import type { ReviewPage } from "@entities/review";
import { siteConfig, type ProductPageConfig } from "@shared/config";
import { plural } from "@shared/lib/plural";
import { PagePagination } from "@shared/ui/page-pagination";

import { ProductReviewsView } from "../ui/product-reviews-view";

export type ProductReviewsProps = {
  reviews: ReviewPage;
  page: number;
  totalPages: number;
  /** Адрес страницы отзывов по номеру */
  href: (page: number) => string;
  config: NonNullable<ProductPageConfig["reviews"]>;
  className?: string;
};

/** Дата отзыва для витрины: «12.01.24» */
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(siteConfig.locale, { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(iso));

/** Отзывы товара: данные страницы отзывов + тексты из конфига → «тупое» представление. Серверный компонент. */
export function ProductReviews({ reviews, page, totalPages, href, config, className }: ProductReviewsProps) {
  const { summary, items } = reviews;

  return (
    <ProductReviewsView
      id={config.pageParam}
      title={config.title}
      titleHidden={config.titleHidden}
      summary={
        summary.count
          ? {
              average: summary.average,
              countLabel: config.countLabel.replace("{count}", `${summary.count} ${plural(summary.count, config.countForms)}`),
            }
          : undefined
      }
      items={items.map((review) => ({ ...review, date: formatDate(review.createdAt) }))}
      verifiedLabel={config.verifiedLabel}
      emptyText={config.emptyText}
      pagination={<PagePagination page={page} totalPages={totalPages} href={href} label={config.title} />}
      className={className}
    />
  );
}
