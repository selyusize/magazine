import { toast } from "@medusajs/ui";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  useSaveRedirect,
  type AdminRedirect,
  type RedirectCode,
} from "./redirects-api";

/** Форма правила: 410 не требует «куда»; ошибки бэкенда (цикл, неверный путь) — под формой. */
export function useRedirectForm(
  redirect: AdminRedirect | null,
  onSaved: () => void,
) {
  const { t } = useTranslation();
  const save = useSaveRedirect();

  const [fromPath, setFromPath] = useState(redirect?.from_path ?? "");
  const [toPath, setToPath] = useState(redirect?.to_path ?? "");
  const [code, setCode] = useState<RedirectCode>(redirect?.code ?? 301);

  const isGone = code === 410;
  const canSubmit =
    fromPath.trim() !== "" &&
    (isGone || toPath.trim() !== "") &&
    !save.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    save.mutate(
      { from_path: fromPath, to_path: isGone ? null : toPath, code },
      {
        onSuccess: () => {
          toast.success(t("redirects.form.saved"));
          onSaved();
        },
      },
    );
  };

  return {
    fromPath,
    setFromPath,
    toPath,
    setToPath,
    code,
    setCode: (value: string) => setCode(Number(value) as RedirectCode),
    isGone,
    canSubmit,
    isSaving: save.isPending,
    error: save.error?.message ?? null,
    submit,
  };
}
