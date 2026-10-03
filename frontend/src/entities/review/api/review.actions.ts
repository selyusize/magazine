"use server";

import { reviewsMock } from "../model/reviews.mock";
import type { ReviewPage } from "../model/types";

export type ReviewListParams = { productId: string; limit: number; offset?: number };

/**
 * Отзывы товара: страница отзывов (новые сверху) и сводка по всем.
 * ВРЕМЕННО — моки. Подключите источник (модуль отзывов Medusa, внешний сервис) — поменяйте только эту функцию:
 * страница товара и разметка для поисковиков получают тот же ReviewPage.
 */
export async function listProductReviews({ limit, offset = 0 }: ReviewListParams): Promise<ReviewPage> {
  const all = [...reviewsMock].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const average = all.length ? all.reduce((sum, review) => sum + review.rating, 0) / all.length : 0;
  return {
    items: all.slice(offset, offset + limit),
    summary: { average: Math.round(average * 10) / 10, count: all.length },
  };
}
