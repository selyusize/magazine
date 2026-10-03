import { cn } from "@shared/lib/utils";
import { RatingStars } from "@shared/ui/rating-stars";

import type { Review } from "../model/types";

export type ReviewItemProps = Review & {
  /** Подпись проверенного покупателя: «Проверенный покупатель» */
  verifiedLabel: string;
  /** Отформатированная дата: «12.01.24» */
  date: string;
  className?: string;
};

/**
 * Отзыв (Figma: Product detail — Reviews): автор слева, оценка, заголовок и текст по центру, дата справа.
 * На мобильных — столбиком. Текст целиком в HTML.
 */
export function ReviewItem({ author, verified, rating, title, text, createdAt, verifiedLabel, date, className }: ReviewItemProps) {
  return (
    <article
      data-slot="review-item"
      className={cn("grid gap-x-8 gap-y-3 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]", className)}
    >
      <div className="flex items-baseline justify-between gap-4 md:flex-col md:justify-start md:gap-0.5">
        <p className="text-400">{author}</p>
        {verified ? <p className="text-100 text-muted-foreground">{verifiedLabel}</p> : null}
      </div>
      <div className="flex max-w-xl flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <RatingStars value={rating} />
          {title ? <h3 className="text-400">{title}</h3> : null}
        </div>
        <p className="text-300">{text}</p>
      </div>
      <time dateTime={createdAt} className="text-200 text-muted-foreground md:text-end">
        {date}
      </time>
    </article>
  );
}
