import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Container } from "@shared/ui/container";
import { Icon } from "@shared/ui/icon";

export type CatalogChip = { label: string; href: string; active?: boolean };

export type CatalogHeaderProps = {
  /** Хлебные крошки или кнопка «назад» над заголовком */
  breadcrumbs?: ReactNode;
  /** h1: название категории или «Каталог» */
  title: string;
  /** Кнопка «назад» слева от заголовка — на родительский раздел. Нет — корень каталога */
  back?: { label: string; href: string };
  /** Подкатегории. Пусто — ряда чипсов нет */
  chips?: CatalogChip[];
  /** Сортировка — левая ячейка панели */
  sort?: ReactNode;
  /** Фильтр — правая ячейка панели */
  filter?: ReactNode;
};

/**
 * Шапка каталога (Figma: Product Listing): крошки, заголовок, чипсы подкатегорий и панель «Сортировка / Фильтр» над чертой.
 * На мобильных панель — отдельной строкой на всю ширину, с md — справа от чипсов, две ячейки по 134px.
 */
export function CatalogHeader({ breadcrumbs, title, back, chips = [], sort, filter }: CatalogHeaderProps) {
  return (
    <div data-slot="catalog-header" className="border-b border-border">
      <Container className={cn("pb-4 md:px-4", breadcrumbs ? "pt-5" : "pt-11")}>
        {breadcrumbs ? <div className="mb-4">{breadcrumbs}</div> : null}
        <div className="flex items-center gap-2">
          {back ? (
            <Button asChild variant="bare" size="bare" className="-ms-1 p-1 text-muted-foreground hover:text-foreground">
              <Link href={back.href} aria-label={`Назад: ${back.label}`}>
                <Icon name="caret-left" className="size-5" />
              </Link>
            </Button>
          ) : null}
          <h1 className="text-900">{title}</h1>
        </div>
        {/* Высота ряда — по чипсам, даже если их нет: шапка одной высоты на всех страницах каталога */}
        <div className="mt-3.25 flex flex-col md:min-h-7.5 md:flex-row md:items-end md:justify-between md:gap-8">
          {chips.length ? (
            <ul aria-label="Подкатегории" className="flex flex-wrap gap-2.5 md:gap-1">
              {chips.map((chip) => (
                <li key={chip.href}>
                  <Link
                    href={chip.href}
                    aria-current={chip.active ? "page" : undefined}
                    className={cn(
                      "flex h-7.5 items-center rounded-full border border-foreground px-4 text-300 transition-colors",
                      chip.active ? "bg-foreground text-background" : "hover:bg-accent",
                    )}
                  >
                    {chip.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {sort || filter ? (
            <div className="mt-11 grid grid-cols-2 md:mt-0 md:ms-auto md:w-67 md:shrink-0">
              <div className="flex justify-center">{sort}</div>
              <div className="flex justify-center">{filter}</div>
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
