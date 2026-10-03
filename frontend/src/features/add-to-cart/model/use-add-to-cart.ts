"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAddLineItem, useCartSheet } from "@entities/cart";
import { routes, siteConfig } from "@shared/config";
import { getErrorMessage } from "@shared/lib/errors";

export type AddToCartMessages = {
  /** Уведомление после добавления */
  addedMessage: string;
  /** Кнопка в уведомлении — открывает шторку корзины (без неё — страница корзины) */
  cartLabel: string;
};

/**
 * Добавление варианта в корзину: уведомление с кнопкой корзины или текст ошибки из общего словаря.
 * Корзина в кеше обновляется ответом мутации — счётчики и мини-корзина без повторного запроса.
 */
export function useAddToCart({ addedMessage, cartLabel }: AddToCartMessages) {
  const router = useRouter();
  const mutation = useAddLineItem();
  const openCart = useCartSheet((state) => state.setOpen);
  const showCart = () => (siteConfig.cart ? openCart(true) : router.push(routes.cart));

  return {
    pending: mutation.isPending,
    add: (variantId: string, quantity = 1) =>
      mutation.mutate(
        { variantId, quantity },
        {
          onSuccess: () => toast.success(addedMessage, { action: { label: cartLabel, onClick: showCart } }),
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      ),
  };
}
