/** Отзыв о товаре */
export type Review = {
  id: string;
  /** Имя как его показывают: «Алина А.» */
  author: string;
  /** Отзыв оставил покупатель этого товара */
  verified: boolean;
  /** 1–5 */
  rating: number;
  title?: string;
  text: string;
  /** ISO-дата */
  createdAt: string;
};

/** Средняя оценка и число отзывов — по всем отзывам товара, не по странице */
export type ReviewSummary = { average: number; count: number };

export type ReviewPage = { items: Review[]; summary: ReviewSummary };
