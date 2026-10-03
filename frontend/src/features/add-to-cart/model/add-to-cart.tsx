"use client";

import { AddToCartButton } from "../ui/add-to-cart-button";
import { useAddToCart, type AddToCartMessages } from "./use-add-to-cart";

export type AddToCartProps = AddToCartMessages & {
  /** Нет — вариант не выбран или его нельзя купить: кнопка неактивна */
  variantId?: string;
  quantity?: number;
  /** Текст кнопки — зависит от выбора (см. виджет страницы товара) */
  label: string;
  className?: string;
};

// Связка: мутация корзины из model + «тупая» кнопка из ui.
export function AddToCart({ variantId, quantity = 1, label, className, ...messages }: AddToCartProps) {
  const { add, pending } = useAddToCart(messages);
  return (
    <AddToCartButton
      label={label}
      disabled={!variantId}
      pending={pending}
      onAdd={() => variantId && add(variantId, quantity)}
      className={className}
    />
  );
}
