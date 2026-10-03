import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@shared/lib/utils";
import { Icon } from "@shared/ui/icon";

import type { ProductColor } from "../model/types";

export type ProductCardProps = {
  title: string;
  href: string;
  /** Уже отформатированная цена: «29 800 ₽». Нет — строка цены не выводится */
  price?: string;
  /** Нет фото — серая подложка того же размера */
  image?: { src: string; alt: string };
  colors?: ProductColor[];
  /** Подсказка браузеру о ширине фото (next/image sizes) — зависит от сетки списка */
  sizes: string;
  /**
   * Кнопка в правом нижнем углу фото (быстрое добавление, избранное).
   * Не передана — декоративный «+»: вся карточка и так ведёт на товар.
   */
  action?: ReactNode;
  /** Кнопка в правом верхнем углу фото: «В избранное» */
  favorite?: ReactNode;
  /** Пропорции фото, если сетка не как в подборках: `aspect-161/220 md:aspect-314/381` */
  imageClassName?: string;
  className?: string;
};

/**
 * Карточка товара: фото, название, цена. Ссылка растянута на всю карточку (after:inset-0),
 * поэтому action и favorite поверх неё остаются отдельными кнопками, а не вложенной ссылкой.
 * Цвета — плашка поверх фото при наведении (на устройствах с мышью).
 */
export function ProductCard({
  title,
  href,
  price,
  image,
  colors = [],
  sizes,
  action,
  favorite,
  imageClassName,
  className,
}: ProductCardProps) {
  const [current] = colors;

  return (
    <article data-slot="product-card" className={cn("group/card relative flex flex-col gap-3.25", className)}>
      <div className={cn("relative aspect-250/280 bg-accent", imageClassName)}>
        {image ? <Image src={image.src} alt={image.alt} fill sizes={sizes} className="object-cover" /> : null}
        {favorite ? <div className="absolute end-2.5 top-2.5 z-10 flex">{favorite}</div> : null}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-end gap-3 p-3.75",
            current && "pointer-fine:group-hover/card:bg-background/80",
          )}
        >
          {current ? (
            // opacity, а не invisible: скринридеры читают цвета и без наведения
            <div className="flex flex-1 flex-col gap-4 opacity-0 pointer-fine:group-hover/card:opacity-100">
              <p className="text-300">{current.name}</p>
              <ul aria-label="Цвета" className="flex gap-1">
                {colors.map((color) => (
                  <li key={color.name}>
                    <span
                      title={color.name}
                      className={cn(
                        "block size-5 rounded-full border bg-(--swatch) bg-clip-content p-px",
                        color === current ? "border-foreground" : "border-transparent",
                      )}
                      style={{ "--swatch": color.value } as CSSProperties}
                    >
                      <span className="sr-only">{color.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className={cn("ms-auto flex", action && "relative z-10")}>{action ?? <Icon name="plus" className="size-4.5" />}</div>
        </div>
      </div>
      <div className="flex flex-col gap-0.75 pb-3.25 text-300">
        <h3>
          <Link href={href} className="after:absolute after:inset-0 group-hover/card:underline">
            {title}
          </Link>
        </h3>
        {price ? <p>{price}</p> : null}
      </div>
    </article>
  );
}
