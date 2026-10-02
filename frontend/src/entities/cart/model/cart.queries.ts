import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { StoreCart } from "@shared/api";
import { unwrap, type ActionResult } from "@shared/lib/action-result";

import { addLineItem, getCart, removeLineItem, updateCart, updateLineItem } from "../api/cart.actions";

export const cartKeys = {
  all: ["cart"] as const,
  current: () => [...cartKeys.all, "current"] as const,
};

/** Для useQuery и для prefetch на сервере (HydrationBoundary). */
export const cartQueryOptions = () =>
  queryOptions({ queryKey: cartKeys.current(), queryFn: () => getCart() });

export function useCart() {
  return useQuery(cartQueryOptions());
}

/** Все мутации корзины возвращают корзину целиком — кладём её в кеш без повторного запроса. */
function useCartMutation<TInput>(action: (input: TInput) => Promise<ActionResult<StoreCart>>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => unwrap(await action(input)),
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.current(), cart),
  });
}

export const useAddLineItem = () => useCartMutation(addLineItem);
export const useUpdateLineItem = () => useCartMutation(updateLineItem);
export const useRemoveLineItem = () => useCartMutation(removeLineItem);
export const useUpdateCart = () => useCartMutation(updateCart);
