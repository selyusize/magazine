"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { routes } from "@shared/config";
import { getErrorMessage, getFieldErrors } from "@shared/lib/errors";

import { useLogin } from "./auth.mutations";
import { loginSchema, type LoginInput } from "./schemas";

/** Вся логика формы входа: валидация, запрос, ошибки, переход после входа. */
export function useLoginForm({ redirectTo = routes.account }: { redirectTo?: string } = {}) {
  const router = useRouter();
  const login = useLogin();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    setFieldErrors(parsed.success ? {} : getFieldErrors(parsed.error));
    if (!parsed.success) return;

    login.mutate(parsed.data, {
      onSuccess: () => {
        router.replace(redirectTo);
        router.refresh();
      },
    });
  }

  return {
    onSubmit,
    isPending: login.isPending,
    fieldErrors,
    formError: login.isError ? getErrorMessage(login.error) : undefined,
    registerHref: withNext(routes.register, redirectTo),
  };
}

export function withNext(href: string, redirectTo: string) {
  return redirectTo === routes.account ? href : `${href}?next=${encodeURIComponent(redirectTo)}`;
}
