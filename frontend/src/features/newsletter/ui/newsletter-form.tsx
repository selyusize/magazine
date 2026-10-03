import Link from "next/link";
import { useId, type SubmitEventHandler } from "react";

import { routes } from "@shared/config";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@shared/ui/field";
import { Input } from "@shared/ui/input";

/** Тексты формы — из siteConfig или свои для баннера/попапа. */
export type NewsletterFormContent = {
  /** Подпись над полем. Не задана — когда заголовок уже есть у контейнера (попап, баннер) */
  title?: string;
  placeholder: string;
  submitLabel: string;
  successMessage: string;
  /** Выравнивание: start — футер, center — попап и баннеры по центру */
  align?: "start" | "center";
};

export type NewsletterFormViewProps = NewsletterFormContent & {
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  isPending: boolean;
  isSubscribed: boolean;
  emailError?: string;
  formError?: string;
};

/**
 * Подписка на рассылку (Figma: Footer → subscription). Только разметка: логика в model/use-newsletter-form.
 * Заголовок — не h-тег: блок повторяется на каждой странице и не должен участвовать в структуре заголовков.
 * Согласие с политикой рядом с кнопкой — требование 152-ФЗ.
 */
export function NewsletterFormView({
  title,
  placeholder,
  submitLabel,
  successMessage,
  align = "start",
  onSubmit,
  isPending,
  isSubscribed,
  emailError,
  formError,
}: NewsletterFormViewProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const emailId = `${id}-email`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const error = emailError ?? formError;

  return (
    <div
      data-slot="newsletter"
      data-align={align}
      className={cn("flex w-full flex-col gap-6", align === "center" && "items-center text-center")}
    >
      {title ? (
        <p id={titleId} className="text-500">
          {title}
        </p>
      ) : null}
      {isSubscribed ? (
        <p role="status" className="text-300">
          {successMessage}
        </p>
      ) : (
        <form
          aria-labelledby={title ? titleId : undefined}
          onSubmit={onSubmit}
          noValidate
          className={cn("flex w-full flex-col gap-4.5", align === "center" ? "items-center" : "items-start")}
        >
          <Field data-invalid={Boolean(emailError) || undefined} className="gap-1.25">
            <FieldLabel htmlFor={emailId} className="sr-only">
              Email
            </FieldLabel>
            <Input
              id={emailId}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder={placeholder}
              aria-invalid={Boolean(emailError) || undefined}
              aria-describedby={error ? `${errorId} ${hintId}` : hintId}
              className="h-11.5 px-3.5 text-300 md:text-300"
            />
            <FieldError id={errorId} className="text-300">
              {error}
            </FieldError>
            <FieldDescription id={hintId} className={cn("text-300 text-current", align === "center" && "text-center")}>
              Подписываясь, вы соглашаетесь с{" "}
              <Link href={routes.privacy} className="hover:no-underline">
                политикой конфиденциальности
              </Link>{" "}
              и{" "}
              <Link href={routes.terms} className="hover:no-underline">
                пользовательским соглашением
              </Link>
              .
            </FieldDescription>
          </Field>
          <Button type="submit" size="xl" disabled={isPending}>
            {submitLabel}
          </Button>
        </form>
      )}
    </div>
  );
}
