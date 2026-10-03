import Link from "next/link";
import { Fragment } from "react";

import { cn } from "@shared/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@shared/ui/breadcrumb";
import { Icon } from "@shared/ui/icon";

import type { Crumb } from "../model/trail";

export type BreadcrumbsViewProps = {
  /** Подпись навигации для скринридеров */
  label: string;
  /** От главной до текущей страницы; последняя — текущая, без ссылки */
  items: Crumb[];
  /** Кнопка «назад» к родителю. Нет — только цепочка */
  back?: Crumb;
  /** Где кнопка заменяет цепочку: mobile — до md, always — везде */
  backMode?: "mobile" | "always";
  className?: string;
};

/**
 * Хлебные крошки: «Главная / Каталог / Платья». Обычные ссылки в HTML — поисковик проходит по ним без JS.
 * Кнопка «назад» — тоже ссылка на родительский раздел (не history.back): работает при заходе из поиска.
 */
export function BreadcrumbsView({ label, items, back, backMode = "mobile", className }: BreadcrumbsViewProps) {
  const backOnly = back && backMode === "always";

  return (
    <Breadcrumb aria-label={label} data-slot="breadcrumbs" className={cn("text-200", className)}>
      {back ? (
        <Link
          href={back.href}
          className={cn(
            "inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground",
            !backOnly && "md:hidden",
          )}
        >
          <Icon name="caret-left" className="size-3" />
          {back.name}
        </Link>
      ) : null}
      <BreadcrumbList className={cn("gap-1.5 text-200", back && "hidden", back && !backOnly && "md:flex")}>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <Fragment key={item.href}>
              <BreadcrumbItem>
                {current ? (
                  <BreadcrumbPage>{item.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {current ? null : <BreadcrumbSeparator className="text-muted-foreground/60">/</BreadcrumbSeparator>}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
