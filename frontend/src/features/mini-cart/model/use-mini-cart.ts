"use client";

import { toast } from "sonner";

import { useCart, useCartSheet, useRemoveLineItem, useUpdateLineItem } from "@entities/cart";
import type { ProductOptionConfig } from "@shared/config";
import { getErrorMessage } from "@shared/lib/errors";

import { cartItemsTotal, toCartLines } from "./lines";

export type UseMiniCartOptions = {
  /** Порядок и подписи значений опций в строке: siteConfig.product.options */
  options: ProductOptionConfig[];
};

/**
 * Шторка корзины: позиции из кеша TanStack Query (тот же запрос, что у счётчика в хедере),
 * изменение количества и удаление. Мутации возвращают корзину целиком — она сразу кладётся в кеш.
 * Пока запрос идёт, строки остаются на месте, кнопки неактивны, у изменяемой строки — спиннер.
 */
export function useMiniCart({ options }: UseMiniCartOptions) {
  const { open, setOpen } = useCartSheet();
  const { data: cart, isPending: loading } = useCart();
  const update = useUpdateLineItem();
  const remove = useRemoveLineItem();

  const onError = (error: unknown) => toast.error(getErrorMessage(error));
  const busy = update.isPending || remove.isPending;

  return {
    open,
    onOpenChange: setOpen,
    /** Корзина ещё не загружена: вместо списка — спиннер */
    loading,
    lines: cart ? toCartLines(cart, options) : [],
    total: cart?.items?.length ? cartItemsTotal(cart) : undefined,
    busy,
    /** Строка, которую сейчас меняют */
    pendingLineId: update.isPending ? update.variables?.lineId : remove.isPending ? remove.variables : undefined,
    onQuantityChange: (lineId: string, quantity: number) => {
      if (busy || quantity < 1) return;
      update.mutate({ lineId, quantity }, { onError });
    },
    onRemove: (lineId: string) => {
      if (busy) return;
      remove.mutate(lineId, { onError });
    },
  };
}

export type MiniCartState = ReturnType<typeof useMiniCart>;
