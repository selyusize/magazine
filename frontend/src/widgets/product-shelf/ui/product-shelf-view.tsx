import type { ReactNode } from "react";

import { ProductCard, type ProductCardItem } from "@entities/product";
import { cn } from "@shared/lib/utils";
import { Container } from "@shared/ui/container";
import { Section } from "@shared/ui/section";
import { Separator } from "@shared/ui/separator";

/**
 * row — карточки в один ряд на всю ширину (главная).
 * centered — заголовок по центру, три карточки узкой сеткой (страница товара: «Носите с», «Вы недавно смотрели»)
 */
export type ProductShelfLayout = "row" | "centered";

export type ProductShelfViewProps = {
  items: ProductCardItem[];
  /** Заголовок секции (h2). Не передан — секция без заголовка */
  title?: ReactNode;
  layout?: ProductShelfLayout;
  /** Черта над секцией — отделяет от подборки выше */
  divided?: boolean;
  className?: string;
};

const layouts: Record<ProductShelfLayout, { section?: string; list: string; sizes: string }> = {
  row: { list: "lg:auto-cols-fr lg:grid-flow-col", sizes: "(min-width: 64rem) 20vw, 195px" },
  // 3 × 316px + отступы — как в макете
  centered: { section: "py-16", list: "lg:mx-auto lg:w-full lg:max-w-248 lg:grid-cols-3", sizes: "(min-width: 64rem) 316px, 195px" },
};

/**
 * Горизонтальная подборка товаров: «Что носить сейчас», «Новинки»…
 * До lg — лента с прокруткой до края экрана, с lg — сетка по layout.
 */
export function ProductShelfView({ items, title, layout = "row", divided, className }: ProductShelfViewProps) {
  const { section, list, sizes } = layouts[layout];

  const shelf = (
    <Section title={title} titleAlign={layout === "centered" ? "center" : "start"} data-widget="product-shelf" className={cn(section, className)}>
      <ul
        className={cn(
          "-mx-(--container-gutter) flex snap-x snap-mandatory scroll-px-(--container-gutter) gap-5 overflow-x-auto px-(--container-gutter) [scrollbar-width:none] lg:mx-0 lg:grid lg:overflow-visible lg:px-0",
          list,
        )}
      >
        {items.map(({ id, ...item }) => (
          <li key={id} className="w-48.75 shrink-0 snap-start lg:w-auto">
            <ProductCard {...item} sizes={sizes} />
          </li>
        ))}
      </ul>
    </Section>
  );

  return divided ? (
    <>
      <Container>
        <Separator />
      </Container>
      {shelf}
    </>
  ) : (
    shelf
  );
}
