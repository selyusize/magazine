"use client";

import { useState, type SubmitEvent } from "react";

import { getErrorMessage, getFieldErrors } from "@shared/lib/errors";

import { useSubscribe } from "./newsletter.mutations";
import { newsletterSchema } from "./schemas";

export type UseNewsletterFormOptions = {
  /** После успешной подписки: закрыть попап, не показывать его снова, отправить событие в аналитику */
  onSubscribed?: () => void;
};

/** Вся логика формы подписки: валидация, запрос, ошибки, состояние «подписан». */
export function useNewsletterForm({ onSubscribed }: UseNewsletterFormOptions = {}) {
  const subscribe = useSubscribe();
  const [emailError, setEmailError] = useState<string>();

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = newsletterSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    setEmailError(parsed.success ? undefined : getFieldErrors(parsed.error).email);
    if (!parsed.success) return;

    subscribe.mutate(parsed.data, { onSuccess: onSubscribed });
  }

  return {
    onSubmit,
    isPending: subscribe.isPending,
    isSubscribed: subscribe.isSuccess,
    emailError,
    formError: subscribe.isError ? getErrorMessage(subscribe.error) : undefined,
  };
}
