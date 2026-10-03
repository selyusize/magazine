import { useId } from "react";

import { cn } from "@shared/lib/utils";
import { Container } from "@shared/ui/container";

import type { Highlight } from "../model/types";

export type HighlightsViewProps = {
  items: Highlight[];
  /** Заголовок секции (h2). titleHidden — только для поисковиков и скринридеров, как в макете */
  title: string;
  titleHidden?: boolean;
  /** Черта над блоком — отделяет его от предыдущего */
  divider?: boolean;
  className?: string;
};

/** Колонок на десктопе — по числу пунктов, не больше четырёх */
const columns = ["md:grid-cols-1", "md:grid-cols-2", "md:grid-cols-3", "md:grid-cols-4"];

/**
 * Особенности (Figma: Product detail — Design / Quality / Sustainability): колонки «надзаголовок, заголовок, текст».
 * Подходит не только товару: преимущества магазина, условия доставки, «почему мы».
 * Заголовки колонок — h3 под h2 секции.
 */
export function HighlightsView({ items, title, titleHidden = true, divider = true, className }: HighlightsViewProps) {
  const titleId = useId();
  if (!items.length) return null;

  return (
    <section aria-labelledby={titleId} data-widget="highlights" className={className}>
      <Container>
        <div className={cn("flex flex-col gap-10 py-14 md:py-16", divider && "border-t border-border")}>
          <h2 id={titleId} className={titleHidden ? "sr-only" : "text-center text-600"}>
            {title}
          </h2>
          <ul className={cn("mx-auto grid w-full max-w-276 gap-x-16 gap-y-10", columns[Math.min(items.length, 4) - 1])}>
            {items.map((item) => (
              <li key={item.title} className="flex max-w-80 flex-col">
                {item.label ? <p className="mb-4 text-100 tracking-wide text-muted-foreground uppercase">{item.label}</p> : null}
                <h3 className="text-400">{item.title}</h3>
                {item.text ? <p className="mt-3 text-200">{item.text}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
