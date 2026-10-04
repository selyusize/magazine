import { toast, usePrompt } from "@medusajs/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useRegenerateWebhookSecret,
  useRevalidateStorefront,
  useStorefrontRevalidations,
  useStorefrontWebhook,
} from "./revalidation-api";

/** Страница «Обновление витрины»: вебхук магазина, перевыпуск секрета, полная ревалидация, журнал. */
export function useStorefrontRevalidationPage() {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const [isSecretVisible, setSecretVisible] = useState(false);

  const journal = useStorefrontRevalidations();
  const webhook = useStorefrontWebhook();
  const revalidate = useRevalidateStorefront();
  const regenerate = useRegenerateWebhookSecret();

  const revalidateAll = () =>
    revalidate.mutate(undefined, {
      onSuccess: () => toast.success(t("storefrontRevalidation.revalidateAll.done")),
      onError: (error) => toast.error(error.message),
    });

  const regenerateSecret = async () => {
    const confirmed = await prompt({
      title: t("storefrontRevalidation.regenerate.title"),
      description: t("storefrontRevalidation.regenerate.description"),
      confirmText: t("storefrontRevalidation.regenerate.confirm"),
      cancelText: t("storefrontRevalidation.cancel"),
    });
    if (!confirmed) return;
    regenerate.mutate(undefined, {
      onSuccess: () => {
        setSecretVisible(true);
        toast.success(t("storefrontRevalidation.regenerate.done"));
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(t("storefrontRevalidation.copied"));
  };

  return {
    revalidations: journal.data ?? [],
    isJournalLoading: journal.isLoading,
    isJournalFetching: journal.isFetching,
    journalError: journal.error,
    webhook: webhook.data ?? null,
    webhookError: webhook.error,
    isSecretVisible,
    toggleSecret: () => setSecretVisible((visible) => !visible),
    copy,
    revalidateAll,
    isRevalidating: revalidate.isPending,
    regenerateSecret,
    isRegenerating: regenerate.isPending,
  };
}
