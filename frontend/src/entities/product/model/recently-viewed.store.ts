"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Сколько товаров помнить: с запасом на исключение текущего и снятых с продажи */
const MAX_ITEMS = 20;

type RecentlyViewedState = {
  /** handle товаров, последний просмотренный — первый */
  handles: string[];
  add: (handle: string) => void;
};

/**
 * Недавно просмотренные товары — в localStorage браузера. Храним только handle: цены и фото
 * подтягиваются свежими при показе. skipHydration — список читается после монтирования, разметка совпадает с SSR.
 */
const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      handles: [],
      add: (handle) => set(({ handles }) => ({ handles: [handle, ...handles.filter((item) => item !== handle)].slice(0, MAX_ITEMS) })),
    }),
    { name: "recently-viewed", version: 1, skipHydration: true },
  ),
);

/**
 * Запоминает открытый товар и отдаёт просмотренные до него — без текущего, последний первым.
 * null — список ещё не прочитан из браузера (на сервере и до монтирования)
 */
export function useRecentlyViewed(currentHandle: string): string[] | null {
  const [previous, setPrevious] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { persist: storage, getState } = useRecentlyViewedStore;
    void Promise.resolve(storage.hasHydrated() ? undefined : storage.rehydrate()).then(() => {
      if (cancelled) return;
      // Снимок до записи текущего: список на странице не прыгает, пока её смотрят
      const { handles, add } = getState();
      setPrevious(handles.filter((handle) => handle !== currentHandle));
      add(currentHandle);
    });
    return () => {
      cancelled = true;
    };
  }, [currentHandle]);

  return previous;
}
