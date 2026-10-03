import { useCartCount } from "@entities/cart";
import { useWishlistCount } from "@entities/wishlist";
import type { HeaderCounter } from "@shared/config";

/** Числа для счётчиков хедера. Корзина ещё не загружена — счётчика нет (на сервере его тоже нет) */
export function useHeaderCounters(): Partial<Record<HeaderCounter, number>> {
  return { cart: useCartCount(), wishlist: useWishlistCount() };
}
