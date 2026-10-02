import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cartKeys } from "@entities/cart";
import { customerKeys } from "@entities/customer";
import type { StoreCustomer } from "@shared/api";
import { unwrap } from "@shared/lib/action-result";

import { login, logout, register } from "../api/auth.actions";

/** После входа/регистрации/выхода покупатель и корзина меняются — обновляем оба кеша. */
function useSyncSession() {
  const queryClient = useQueryClient();
  return (customer: StoreCustomer | null) => {
    queryClient.setQueryData(customerKeys.me(), customer);
    return queryClient.invalidateQueries({ queryKey: cartKeys.all });
  };
}

export function useLogin() {
  const sync = useSyncSession();
  return useMutation({
    mutationFn: async (input: Parameters<typeof login>[0]) => unwrap(await login(input)),
    onSuccess: sync,
  });
}

export function useRegister() {
  const sync = useSyncSession();
  return useMutation({
    mutationFn: async (input: Parameters<typeof register>[0]) => unwrap(await register(input)),
    onSuccess: sync,
  });
}

export function useLogout() {
  const sync = useSyncSession();
  return useMutation({
    mutationFn: async () => unwrap(await logout()),
    onSuccess: () => sync(null),
  });
}
