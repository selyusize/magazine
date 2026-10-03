"use client";

import { create } from "zustand";

type CartSheetState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

/**
 * Открыта ли шторка корзины. Общее состояние: шторку открывает иконка в хедере
 * и кнопка в уведомлении «Товар добавлен» на странице товара.
 */
export const useCartSheet = create<CartSheetState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
