import type { Review, ReviewSummary } from "./types";

/**
 * Рейтинг и отзывы для разметки товара (Product.aggregateRating, Product.review) — звёзды в сниппете.
 * Без отзывов — пустой объект: Google не принимает aggregateRating с нулём отзывов
 */
export function reviewsJsonLd(summary: ReviewSummary, reviews: Review[]) {
  if (!summary.count) return {};
  return {
    aggregateRating: { "@type": "AggregateRating", ratingValue: summary.average, reviewCount: summary.count, bestRating: 5, worstRating: 1 },
    review: reviews.map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.author },
      datePublished: review.createdAt,
      ...(review.title && { name: review.title }),
      reviewBody: review.text,
      reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
    })),
  };
}
