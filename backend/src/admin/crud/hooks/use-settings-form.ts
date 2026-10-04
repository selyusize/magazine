import { toast } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { adminFetch } from "../../lib/admin-fetch";
import { isRecord } from "../../lib/narrow";
import type { SettingsResource } from "../types";
import {
  isComplete,
  toFormValues,
  toRequestBody,
  type FormValue,
  type FormValues,
} from "./form-values";

const toRow = (value: unknown) => ({
  id: "settings",
  ...(isRecord(value) ? value : {}),
});

/** Форма настроек-синглтона: загрузка, изменённые поля в POST, ошибки бэкенда — под формой. */
export function useSettingsForm(resource: SettingsResource) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const key = ["admin-settings", resource.path] as const;

  const settings = useQuery({
    queryKey: key,
    queryFn: async () =>
      toRow(
        (await adminFetch<Record<string, unknown>>(resource.path))[
          resource.response
        ],
      ),
  });
  const initial = useMemo(
    () => (settings.data ? toFormValues(resource.fields, settings.data) : null),
    [resource, settings.data],
  );
  const [values, setValues] = useState<FormValues | null>(null);
  useEffect(() => setValues(initial), [initial]);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      adminFetch(resource.path, { method: "POST", body }),
    onSuccess: () => {
      toast.success(t("crud.saved"));
      return queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const body =
    values && initial ? toRequestBody(resource.fields, values, initial) : {};
  const canSubmit =
    values !== null &&
    isComplete(resource.fields, values) &&
    Object.keys(body).length > 0 &&
    !save.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) save.mutate(body);
  };

  return {
    values,
    setValue: (name: string, value: FormValue) =>
      setValues((current) =>
        current ? { ...current, [name]: value } : current,
      ),
    isLoading: settings.isLoading,
    loadError: settings.error?.message ?? null,
    error: save.error?.message ?? null,
    isSaving: save.isPending,
    canSubmit,
    submit,
  };
}
