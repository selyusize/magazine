"use client";

import { useWishlistItem } from "@entities/wishlist";

import { WishlistButton } from "../ui/wishlist-button";

export type WishlistToggleProps = {
  productId: string;
  title: string;
  className?: string;
};

/** Сердечко на карточке товара: состояние из избранного (entities/wishlist) + «тупая» кнопка. */
export function WishlistToggle({ productId, ...props }: WishlistToggleProps) {
  const { active, toggle } = useWishlistItem(productId);
  return <WishlistButton active={active} onToggle={toggle} {...props} />;
}
