"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

import type { CartConfig } from "@shared/config";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { ButtonGroup } from "@shared/ui/button-group";
import { Empty, EmptyContent, EmptyDescription } from "@shared/ui/empty";
import { Icon } from "@shared/ui/icon";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@shared/ui/sheet";
import { Spinner } from "@shared/ui/spinner";

import type { CartLineView } from "../model/lines";
import type { MiniCartState } from "../model/use-mini-cart";

export type MiniCartContent = CartConfig & {
  /** Адрес кнопки оформления */
  checkoutHref: string;
};

export type MiniCartViewProps = MiniCartContent &
  MiniCartState & {
    /** Элемент, открывающий шторку: иконка корзины в хедере. Должен принимать onClick и ref */
    trigger: ReactElement;
  };

/** Маленькая иконка-кнопка: область нажатия ~30px без сдвига раскладки */
const hitArea = "relative after:absolute after:-inset-2";

type CartLineProps = {
  line: CartLineView;
  pending: boolean;
  busy: boolean;
  labels: Pick<CartConfig, "removeLabel" | "quantityLabel" | "decreaseLabel" | "increaseLabel">;
  onQuantityChange: MiniCartState["onQuantityChange"];
  onRemove: MiniCartState["onRemove"];
};

/** Строка: фото 100×130, название (две строки), опции, сумма, количество; крестик удаления справа */
function CartLine({ line, pending, busy, labels, onQuantityChange, onRemove }: CartLineProps) {
  return (
    <li className="flex gap-6.25 py-10 first:pt-5" aria-busy={pending || undefined}>
      <div className="relative h-32.5 w-25 shrink-0 bg-accent">
        {line.image ? <Image src={line.image.src} alt={line.image.alt} fill sizes="100px" className="object-cover" /> : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-4">
          <h3 className="line-clamp-2 flex-1 text-400">
            {line.href ? (
              <SheetClose asChild>
                <Link href={line.href} className="hover:underline">
                  {line.title}
                </Link>
              </SheetClose>
            ) : (
              line.title
            )}
          </h3>
          <Button
            variant="bare"
            size="bare"
            aria-label={`${labels.removeLabel}: ${line.title}`}
            disabled={busy}
            onClick={() => onRemove(line.id)}
            className={cn("mt-1.25 text-muted-foreground hover:text-foreground", hitArea)}
          >
            <Icon name="close" className="size-2.5" />
          </Button>
        </div>
        {line.options ? <p className="mt-2.5 text-200 text-muted-foreground">{line.options}</p> : null}
        <p className="mt-2.5 text-200">{line.price}</p>

        <div className="mt-2 flex items-center gap-2.5">
          <ButtonGroup
            aria-label={labels.quantityLabel}
            className="h-6.5 w-19.5 items-center justify-between rounded-full border border-border px-2.5"
          >
            <Button
              variant="bare"
              size="bare"
              aria-label={labels.decreaseLabel}
              disabled={busy || line.quantity <= 1}
              onClick={() => onQuantityChange(line.id, line.quantity - 1)}
              className="relative after:absolute after:-inset-1.5"
            >
              <Icon name="minus" className="size-3" />
            </Button>
            <span aria-live="polite" className="text-300 tabular-nums">
              {line.quantity}
            </span>
            <Button
              variant="bare"
              size="bare"
              aria-label={labels.increaseLabel}
              disabled={busy}
              onClick={() => onQuantityChange(line.id, line.quantity + 1)}
              className="relative after:absolute after:-inset-1.5"
            >
              <Icon name="plus" className="size-3" />
            </Button>
          </ButtonGroup>
          {pending ? <Spinner aria-hidden className="size-3.5 text-muted-foreground" /> : null}
        </div>
      </div>
    </li>
  );
}

/**
 * Шторка корзины (Figma: Shopping bag): справа, на мобильных во всю ширину, с sm — 400px, как шторка фильтров.
 * Список позиций прокручивается, внизу — примечание и кнопка оформления с суммой товаров.
 */
export function MiniCartView({
  trigger,
  title,
  note,
  checkoutLabel,
  checkoutHref,
  emptyText,
  emptyLink,
  removeLabel,
  quantityLabel,
  decreaseLabel,
  increaseLabel,
  open,
  onOpenChange,
  loading,
  lines,
  total,
  busy,
  pendingLineId,
  onQuantityChange,
  onRemove,
}: MiniCartViewProps) {
  const labels = { removeLabel, quantityLabel, decreaseLabel, increaseLabel };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-full gap-0 border-l-0 shadow-none data-[side=right]:w-full data-[side=right]:sm:max-w-100"
      >
        <SheetHeader className="h-17 shrink-0 flex-row items-center justify-between border-b border-border px-7.5 py-0">
          <SheetTitle className="text-600 font-normal">{title}</SheetTitle>
          <SheetClose asChild>
            <Button variant="bare" size="bare" aria-label="Закрыть" className={hitArea}>
              <Icon name="close" className="size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {loading && !lines.length ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner aria-label="Загружаем корзину" className="size-5 text-muted-foreground" />
          </div>
        ) : null}

        {!loading && !lines.length ? (
          <Empty className="gap-6 px-7.5">
            <EmptyDescription className="text-300 text-muted-foreground">{emptyText}</EmptyDescription>
            {emptyLink ? (
              <EmptyContent>
                <SheetClose asChild>
                  <Button asChild size="xl" variant="outline" className="rounded-none">
                    <Link href={emptyLink.href}>{emptyLink.label}</Link>
                  </Button>
                </SheetClose>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : null}

        {lines.length ? (
          <ul className="flex-1 divide-y divide-border overflow-y-auto px-7.5">
            {lines.map((line) => (
              <CartLine
                key={line.id}
                line={line}
                pending={line.id === pendingLineId}
                busy={busy}
                labels={labels}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </ul>
        ) : null}

        {lines.length ? (
          <SheetFooter className="mt-0 shrink-0 gap-4.5 border-t border-border px-7.5 py-5">
            {note ? <p className="text-300 text-muted-foreground">{note}</p> : null}
            <SheetClose asChild>
              <Button asChild size="xl" className="w-full gap-5 rounded-none">
                <Link href={checkoutHref}>
                  <span>{checkoutLabel}</span>
                  {total ? <span>{total}</span> : null}
                </Link>
              </Button>
            </SheetClose>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
