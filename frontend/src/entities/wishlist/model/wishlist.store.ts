"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  /** id товаров в порядке добавления */
  ids: string[];
  toggle: (id: string) => void;
};

/**
 * Избранное гостя — в localStorage браузера. Когда появится избранное в аккаунте (Medusa),
 * меняется только это хранилище: кнопки и счётчик в хедере работают через хуки ниже.
 * skipHydration: на сервере списка нет — читаем его после монтирования, чтобы разметка совпала с SSR.
 */
const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set(({ ids }) => ({ ids: ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id] })),
    }),
    { name: "wishlist", version: 1, skipHydration: true },
  ),
);

/** Подтягивает сохранённый список после монтирования (один раз на страницу) */
function useRehydrate() {
  useEffect(() => {
    if (!useWishlistStore.persist.hasHydrated()) void useWishlistStore.persist.rehydrate();
  }, []);
}

export function useWishlistItem(id: string) {
  useRehydrate();
  const active = useWishlistStore((state) => state.ids.includes(id));
  const toggle = useWishlistStore((state) => state.toggle);
  return { active, toggle: () => toggle(id) };
}

export function useWishlistCount() {
  useRehydrate();
  return useWishlistStore((state) => state.ids.length);
}
