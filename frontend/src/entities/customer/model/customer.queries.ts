import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrap } from "@shared/lib/action-result";

import { getCustomer, updateCustomer } from "../api/customer.actions";

export const customerKeys = {
  all: ["customer"] as const,
  me: () => [...customerKeys.all, "me"] as const,
};

export const customerQueryOptions = () =>
  queryOptions({ queryKey: customerKeys.me(), queryFn: () => getCustomer() });

/** `data === null` — гость. */
export function useCustomer() {
  return useQuery(customerQueryOptions());
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof updateCustomer>[0]) => unwrap(await updateCustomer(input)),
    onSuccess: (customer) => queryClient.setQueryData(customerKeys.me(), customer),
  });
}
