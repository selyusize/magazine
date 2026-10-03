import type { CSSProperties } from "react";

import { icons } from "@shared/config";
import { cn } from "@shared/lib/utils";

export type RatingStarsProps = {
  /** Оценка: 4.4 — четыре звезды и почти половина пятой */
  value: number;
  max?: number;
  /** Подпись для скринридеров. По умолчанию «Оценка 4,4 из 5» */
  label?: string;
  /** Размер звезды и отступ — классами `[--star:0.75rem] [--star-gap:0.125rem]`; цвет — text-* */
  className?: string;
};

/**
 * Звёзды рейтинга одним элементом: ряд звёзд — маской (иконка star из реестра), заливка — градиентом до доли оценки.
 * Дробная оценка закрашивает звезду частично. Цвет — currentColor, пустые звёзды — он же, бледнее.
 */
export function RatingStars({ value, max = 5, label, className }: RatingStarsProps) {
  const rating = Math.min(Math.max(value, 0), max);
  const full = Math.floor(rating);
  // Граница заливки: целые звёзды с отступами + доля следующей звезды
  const edge = `calc(${full} * (var(--star) + var(--star-gap)) + ${rating - full} * var(--star))`;

  return (
    <span
      role="img"
      aria-label={label ?? `Оценка ${rating.toLocaleString("ru-RU")} из ${max}`}
      data-slot="rating-stars"
      className={cn("inline-block shrink-0 align-middle [--star-gap:0.125rem] [--star:0.75rem]", className)}
      style={
        {
          width: `calc(${max} * var(--star) + ${max - 1} * var(--star-gap))`,
          height: "var(--star)",
          background: `linear-gradient(90deg, currentColor ${edge}, color-mix(in oklab, currentColor 20%, transparent) ${edge})`,
          maskImage: `url(${icons.star})`,
          maskSize: "var(--star) var(--star)",
          maskRepeat: "space no-repeat",
        } as CSSProperties
      }
    />
  );
}
