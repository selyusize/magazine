import { toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { type ExchangeSupplier, useSaveExchangeSettings } from "./exchange-api";
import {
  exchangeURL,
  type ExchangeSettingsForm,
  toExchangeSettingsBody,
  toExchangeSettingsForm,
} from "./exchange-settings-form";

/** Форма настроек обмена поставщика: значения, сохранение, адрес обмена для 1С. */
export function useExchangeSettingsForm(supplier: ExchangeSupplier) {
  const { t } = useTranslation();
  const save = useSaveExchangeSettings();
  const [form, setForm] = useState<ExchangeSettingsForm>(() => toExchangeSettingsForm(supplier));

  useEffect(() => setForm(toExchangeSettingsForm(supplier)), [supplier]);

  const set = <K extends keyof ExchangeSettingsForm>(field: K, value: ExchangeSettingsForm[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = () =>
    save.mutate(
      { supplier_id: supplier.id, body: toExchangeSettingsBody(form, supplier.markup ?? {}) },
      {
        onSuccess: () => toast.success(t("exchange.settings.saved")),
        onError: (error) => toast.error(error.message),
      },
    );

  const origin = import.meta.env.VITE_BACKEND_URL || window.location.origin;

  return {
    form,
    set,
    submit,
    isSaving: save.isPending,
    url: exchangeURL(origin, supplier.id),
    copyURL: async (url: string) => {
      await navigator.clipboard.writeText(url);
      toast.success(t("exchange.settings.copied"));
    },
  };
}
