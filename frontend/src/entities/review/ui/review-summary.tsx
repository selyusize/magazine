import { cn } from "@shared/lib/utils";
import { RatingStars } from "@shared/ui/rating-stars";

export type ReviewSummaryViewProps = {
  /** Средняя оценка: 4.4 */
  average: number;
  /** «На основе 14 отзывов» — уже со склонением */
  countLabel: string;
  className?: string;
};

/** Средняя оценка крупно, звёзды и число отзывов под ними. */
export function ReviewSummaryView({ average, countLabel, className }: ReviewSummaryViewProps) {
  return (
    <div data-slot="review-summary" className={cn("flex flex-col gap-1", className)}>
      <p className="flex items-center gap-2">
        <span className="text-900">{average.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
        <RatingStars value={average} />
      </p>
      <p className="text-200">{countLabel}</p>
    </div>
  );
}
