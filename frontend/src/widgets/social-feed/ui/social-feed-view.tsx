import type { ReactNode } from "react";

import { cn } from "@shared/lib/utils";
import { Section } from "@shared/ui/section";

import type { SocialNetwork, SocialPost as SocialPostData } from "../model/types";
import { SocialPost } from "./social-post";

/** Колонок на десктопе — по числу фото, чтобы ряд всегда был полным */
const columnsStyles = {
  1: { grid: "md:grid-cols-1", sizes: "(min-width: 48rem) 100vw, 33vw" },
  2: { grid: "md:grid-cols-2", sizes: "(min-width: 48rem) 50vw, 33vw" },
  3: { grid: "md:grid-cols-3", sizes: "33vw" },
  4: { grid: "md:grid-cols-4", sizes: "(min-width: 48rem) 25vw, 33vw" },
  5: { grid: "md:grid-cols-5", sizes: "(min-width: 48rem) 20vw, 33vw" },
  6: { grid: "md:grid-cols-6", sizes: "(min-width: 48rem) 17vw, 33vw" },
} satisfies Record<number, { grid: string; sizes: string }>;

export type SocialFeedViewProps = {
  items: SocialPostData[];
  /** Заголовок секции (h2). Не передан — секция без заголовка */
  title?: ReactNode;
  network: SocialNetwork;
};

/** Лента соцсети: ряд квадратных фото-ссылок. На мобильных три в ряд, остальные скрыты. */
export function SocialFeedView({ items, title, network }: SocialFeedViewProps) {
  const styles = columnsStyles[Math.min(Math.max(items.length, 1), 6) as keyof typeof columnsStyles];

  return (
    <Section title={title} titleAlign="center" data-widget="social-feed">
      <ul className={cn("grid grid-cols-3 gap-5", styles.grid)}>
        {items.map((item) => (
          <li key={item.id} className="max-md:nth-[n+4]:hidden">
            <SocialPost {...item} network={network} sizes={styles.sizes} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
