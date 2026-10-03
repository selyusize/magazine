import Image from "next/image";
import { useId } from "react";

import { cn } from "@shared/lib/utils";
import { Container } from "@shared/ui/container";

import type { LookbookImage } from "../model/types";

export type LookbookColumns = 2 | 3;

const columnStyles: Record<LookbookColumns, { grid: string; sizes: string }> = {
  2: { grid: "md:grid-cols-2", sizes: "(min-width: 48rem) 50vw, 100vw" },
  3: { grid: "md:grid-cols-3", sizes: "(min-width: 48rem) 33vw, 100vw" },
};

export type LookbookViewProps = {
  images: LookbookImage[];
  /** Заголовок секции (h2): «Элегантная простота». Нет — h2 только для поисковиков из hiddenTitle */
  title?: string;
  /** Подзаголовок под заголовком */
  subtitle?: string;
  /** Заголовок для поисковиков и скринридеров, если видимого нет */
  hiddenTitle?: string;
  columns?: LookbookColumns;
  /** Пропорции фото: `1 / 1`, `3 / 4` */
  aspectRatio?: string;
  className?: string;
};

/**
 * Лукбук (Figma: Product detail — Elegant Ease): заголовок по центру и сетка фото в образах.
 * Все фото в HTML с alt и лениво загружаются — блок ниже первого экрана.
 */
export function LookbookView({
  images,
  title,
  subtitle,
  hiddenTitle,
  columns = 2,
  aspectRatio = "1 / 1",
  className,
}: LookbookViewProps) {
  const titleId = useId();
  const heading = title ?? hiddenTitle;
  if (!images.length) return null;

  return (
    <section aria-labelledby={heading ? titleId : undefined} data-widget="lookbook" className={className}>
      <Container className="flex flex-col gap-10 py-10 md:gap-11 md:py-14">
        {heading ? (
          <div className={cn("flex flex-col items-center gap-3 text-center", !title && "sr-only")}>
            <h2 id={titleId} className="text-700">
              {heading}
            </h2>
            {subtitle ? <p className="text-300">{subtitle}</p> : null}
          </div>
        ) : null}
        <ul className={cn("grid gap-2.5 md:gap-5", columnStyles[columns].grid)}>
          {images.map((image) => (
            <li key={image.src} className="relative overflow-hidden bg-accent" style={{ aspectRatio }}>
              <Image src={image.src} alt={image.alt} fill sizes={columnStyles[columns].sizes} className="object-cover" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
