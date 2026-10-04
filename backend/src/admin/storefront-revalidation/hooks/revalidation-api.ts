import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminFetch } from "../../lib/admin-fetch";

export type RevalidationStatus = "pending" | "sending" | "sent" | "failed";

export type StorefrontRevalidation = {
  id: string;
  tags: string[];
  status: RevalidationStatus;
  attempts: number;
  due_at: string;
  sent_at: string | null;
  response_status: number | null;
  error: string | null;
  created_at: string;
};

export type StorefrontWebhook = {
  revalidate_url: string;
  revalidate_secret: string | null;
};

const JOURNAL_KEY = ["admin-storefront-revalidations"] as const;
const WEBHOOK_KEY = ["admin-storefront-webhook"] as const;

/** Пачки уходят через секунды после правки — журнал обновляется сам, пока страница открыта. */
const JOURNAL_REFRESH_MS = 5_000;

export function useStorefrontRevalidations() {
  return useQuery({
    queryKey: JOURNAL_KEY,
    queryFn: async () =>
      (
        await adminFetch<{ storefront_revalidations: StorefrontRevalidation[] }>(
          "/admin/storefront-revalidations",
        )
      ).storefront_revalidations,
    refetchInterval: JOURNAL_REFRESH_MS,
    placeholderData: (previous) => previous,
  });
}

export function useStorefrontWebhook() {
  return useQuery({
    queryKey: WEBHOOK_KEY,
    queryFn: async () =>
      (
        await adminFetch<{ storefront_webhook: StorefrontWebhook }>(
          "/admin/shops/current/revalidate-secret",
        )
      ).storefront_webhook,
  });
}

/** «Обновить витрину целиком»: все групповые теги текущего магазина в очередь. */
export function useRevalidateStorefront() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      adminFetch<{ ids: string[] }>("/admin/storefront-revalidations", {
        method: "POST",
        body: {},
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: JOURNAL_KEY }),
  });
}

export function useRegenerateWebhookSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (
        await adminFetch<{ storefront_webhook: StorefrontWebhook }>(
          "/admin/shops/current/revalidate-secret",
          { method: "POST", body: {} },
        )
      ).storefront_webhook,
    onSuccess: (webhook) => queryClient.setQueryData(WEBHOOK_KEY, webhook),
  });
}
