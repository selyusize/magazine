import { toast } from "@medusajs/ui";
import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { CRUDResource, CRUDRow } from "../types";
import { useCRUDApi } from "./crud-api";
import {
  InvalidJSONError,
  isComplete,
  toFormValues,
  toRequestBody,
  type FormValue,
} from "./form-values";
import { useCategoryOptions } from "./use-category-options";

/** Форма записи раздела: создание (`row = null`) или изменение. Ошибки бэкенда (занятый адрес) — под формой. */
export function useCRUDForm(
  resource: CRUDResource,
  row: CRUDRow | null,
  onSaved: () => void,
) {
  const { t } = useTranslation();
  const save = useCRUDApi(resource).useSave();
  const categories = useCategoryOptions(
    resource.fields.some((field) => field.type === "category"),
  );

  const initial = useMemo(
    () => (row ? toFormValues(resource.fields, row) : null),
    [resource, row],
  );
  const [values, setValues] = useState(
    () => initial ?? toFormValues(resource.fields, null),
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = isComplete(resource.fields, values) && !save.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    let body: Record<string, unknown>;
    try {
      body = toRequestBody(resource.fields, values, initial);
    } catch (error) {
      if (!(error instanceof InvalidJSONError)) throw error;
      setLocalError(
        t("crud.invalidJSON", {
          field: t(`${resource.i18n}.fields.${error.field}`),
        }),
      );
      return;
    }
    setLocalError(null);

    save.mutate(
      { id: row?.id ?? null, body },
      {
        onSuccess: () => {
          toast.success(t("crud.saved"));
          onSaved();
        },
      },
    );
  };

  return {
    values,
    setValue: (name: string, value: FormValue) =>
      setValues((current) => ({ ...current, [name]: value })),
    categories: categories.data ?? [],
    canSubmit,
    isSaving: save.isPending,
    error: localError ?? save.error?.message ?? null,
    submit,
  };
}
