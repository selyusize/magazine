import type { ReactNode } from "react";

import { cn } from "@shared/lib/utils";
import { Section } from "@shared/ui/section";

import type { CollectionBanner as CollectionBannerData } from "../model/types";
import { CollectionBanner } from "./collection-banner";

export type CollectionBannersColumns = 2 | 3 | 4;

/** На мобильных карточки квадратные в одну колонку, с md — в ряд с пропорциями макета */
const columnsStyles: Record<CollectionBannersColumns, { grid: string; banner: string; sizes: string }> = {
  2: { grid: "md:grid-cols-2", banner: "md:aspect-658/719", sizes: "(min-width: 48rem) 50vw, 100vw" },
  3: { grid: "md:grid-cols-3", banner: "md:aspect-432/532", sizes: "(min-width: 48rem) 33vw, 100vw" },
  4: { grid: "md:grid-cols-4", banner: "md:aspect-432/532", sizes: "(min-width: 48rem) 25vw, 100vw" },
};

export type CollectionBannersViewProps = {
  items: CollectionBannerData[];
  /** Заголовок секции (h2). Не передан — секция без заголовка */
  title?: ReactNode;
  titleHidden?: boolean;
  columns: CollectionBannersColumns;
};

/** Секция карточек-подборок: «Новинки», «Хиты продаж»… Все ссылки и подписи в HTML с сервера. */
export function CollectionBannersView({ items, title, titleHidden, columns }: CollectionBannersViewProps) {
  const styles = columnsStyles[columns];

  return (
    <Section title={title} titleHidden={titleHidden} data-widget="collection-banners">
      <ul className={cn("grid gap-5", styles.grid)}>
        {items.map((item) => (
          <li key={item.id} className="flex">
            <CollectionBanner {...item} sizes={styles.sizes} className={cn("aspect-square w-full", styles.banner)} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
