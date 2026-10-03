import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import type { HeaderAction, HeaderCounter, HeaderPanel } from "@shared/config";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Icon } from "@shared/ui/icon";

import { hitArea } from "./classes";

/** Шторка действия: получает готовую кнопку-триггер (иконка и счётчик) и оборачивает её */
export type HeaderPanelRender = (trigger: ReactElement) => ReactNode;

export type HeaderActionsViewProps = {
  items: HeaderAction[];
  /** Числа для счётчиков; нет значения — счётчик не показывается */
  counters?: Partial<Record<HeaderCounter, number>>;
  /** Шторки для действий с panel. Нет шторки — действие остаётся ссылкой */
  panels?: Partial<Record<HeaderPanel, HeaderPanelRender>>;
};

/** Правая часть хедера: аккаунт, избранное, корзина, магазины… — набор задаётся данными. */
export function HeaderActionsView({ items, counters, panels }: HeaderActionsViewProps) {
  return (
    <ul data-slot="header-actions" className="flex items-center gap-3.25 md:gap-4.5">
      {items.map((item) => {
        const count = item.counter ? counters?.[item.counter] : undefined;
        const ariaLabel = item.icon ? (count === undefined ? item.label : `${item.label}: ${count}`) : undefined;
        const panel = item.panel ? panels?.[item.panel] : undefined;
        const className = cn("text-100 hover:opacity-60 md:text-300", item.icon && hitArea);
        const content = (
          <>
            {item.icon ? <Icon name={item.icon} /> : item.label}
            {count === undefined ? null : <span aria-hidden>{count}</span>}
          </>
        );

        return (
          <li key={item.href} className={item.mobile ? "flex" : "hidden md:flex"}>
            {panel ? (
              panel(
                <Button variant="bare" size="bare" aria-label={ariaLabel} className={className}>
                  {content}
                </Button>,
              )
            ) : (
              <Button asChild variant="bare" size="bare" className={className}>
                <Link href={item.href} aria-label={ariaLabel}>
                  {content}
                </Link>
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
