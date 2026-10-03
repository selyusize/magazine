"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@shared/ui/dropdown-menu";
import { Icon } from "@shared/ui/icon";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@shared/ui/sheet";

import type { SortMenuItem } from "../model/sort";

export type SortMenuProps = {
  /** Подпись кнопки и заголовок шторки: «Сортировка» */
  label: string;
  items: SortMenuItem[];
  className?: string;
};

/** Пункт списка: 52px высотой, текущий — основным цветом, остальные — приглушённым */
const itemClass = (active: boolean) =>
  cn("flex h-13 items-center px-8 text-300", active ? "text-foreground" : "text-muted-foreground hover:text-foreground");

/** Кнопка «Сортировка ⌄». Пропсы и ref приходят от Trigger (asChild) */
function SortTrigger({ label, className, ...props }: ComponentProps<typeof Button> & { label: string }) {
  return (
    <Button variant="bare" size="bare" className={cn("gap-1 text-300", className)} {...props}>
      {label}
      <Icon name="caret-down" />
    </Button>
  );
}

/**
 * Сортировка (Figma: Sorting): с md — выпадающий список под кнопкой, на мобильных — шторка снизу.
 * Пункты — обычные ссылки `?sort=`: выбор работает и без JS, страница рендерится на сервере.
 */
export function SortMenu({ label, items, className }: SortMenuProps) {
  return (
    <div data-slot="sort-menu" className={cn("flex", className)}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild className="hidden md:inline-flex">
          <SortTrigger label={label} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          alignOffset={-14}
          sideOffset={17}
          className="w-63.25 rounded-none p-0 py-7.5 shadow-[0_4px_24px_rgb(0_0_0/0.08)] ring-0"
        >
          {items.map((item) => (
            <DropdownMenuItem key={item.href} asChild className={cn(itemClass(item.active), "rounded-none py-0")}>
              <Link href={item.href} aria-current={item.active ? "true" : undefined}>
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <SortTrigger label={label} />
        </SheetTrigger>
        <SheetContent side="bottom" showCloseButton={false} aria-describedby={undefined} className="gap-0 border-t-0 shadow-none">
          <SheetHeader className="relative h-17 justify-center border-b border-border p-0">
            <SheetTitle className="text-center text-600 font-normal">{label}</SheetTitle>
            <SheetClose asChild>
              <Button
                variant="bare"
                size="bare"
                aria-label="Закрыть"
                className="absolute end-7.5 top-1/2 -translate-y-1/2 after:absolute after:-inset-2"
              >
                <Icon name="close" className="size-4" />
              </Button>
            </SheetClose>
          </SheetHeader>
          <ul className="py-7.5">
            {items.map((item) => (
              <li key={item.href}>
                <SheetClose asChild>
                  <Link href={item.href} aria-current={item.active ? "true" : undefined} className={itemClass(item.active)}>
                    {item.label}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
