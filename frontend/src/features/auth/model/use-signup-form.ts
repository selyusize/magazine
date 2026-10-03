"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";

import { routes } from "@shared/config";
import { getErrorMessage, getFieldErrors } from "@shared/lib/errors";

import { useRegister } from "./auth.mutations";
import { MIN_PASSWORD_LENGTH, signupFormSchema, type SignupFormInput } from "./schemas";
import { withNext } from "./use-login-form";

/** Вся логика формы регистрации: валидация, запрос, ошибки, переход после регистрации. */
export function useSignupForm({ redirectTo = routes.account }: { redirectTo?: string } = {}) {
  const router = useRouter();
  const register = useRegister();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignupFormInput, string>>>({});

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signupFormSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    setFieldErrors(parsed.success ? {} : getFieldErrors(parsed.error));
    if (!parsed.success) return;

    const { email, password } = parsed.data;
    register.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.replace(redirectTo);
          router.refresh();
        },
      },
    );
  }

  return {
    onSubmit,
    isPending: register.isPending,
    fieldErrors,
    formError: register.isError ? getErrorMessage(register.error) : undefined,
    loginHref: withNext(routes.login, redirectTo),
    minPasswordLength: MIN_PASSWORD_LENGTH,
  };
}
