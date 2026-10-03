import Link from "next/link";
import type { SubmitEventHandler } from "react";

import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@shared/ui/field";
import { Input } from "@shared/ui/input";

import { AuthImage } from "./auth-image";
import { LegalNotice } from "./legal-notice";

export type SignupFormViewProps = {
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  isPending: boolean;
  fieldErrors: { email?: string; password?: string; confirmPassword?: string };
  formError?: string;
  loginHref: string;
  minPasswordLength: number;
};

/** Блок shadcn signup-04. Только разметка: данные и обработчики приходят из model/use-signup-form. */
export function SignupFormView({
  onSubmit,
  isPending,
  fieldErrors,
  formError,
  loginHref,
  minPasswordLength,
}: SignupFormViewProps) {
  const passwordError = fieldErrors.password ?? fieldErrors.confirmPassword;

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Создайте аккаунт</h1>
                <p className="text-sm text-balance text-muted-foreground">Укажите email, чтобы зарегистрироваться</p>
              </div>
              <Field data-invalid={Boolean(fieldErrors.email) || undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  aria-invalid={Boolean(fieldErrors.email) || undefined}
                />
                {fieldErrors.email ? (
                  <FieldError>{fieldErrors.email}</FieldError>
                ) : (
                  <FieldDescription>На него придут письма о заказах. Мы не передаём его третьим лицам.</FieldDescription>
                )}
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field data-invalid={Boolean(fieldErrors.password) || undefined}>
                    <FieldLabel htmlFor="password">Пароль</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(fieldErrors.password) || undefined}
                    />
                  </Field>
                  <Field data-invalid={Boolean(fieldErrors.confirmPassword) || undefined}>
                    <FieldLabel htmlFor="confirmPassword">Повторите пароль</FieldLabel>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(fieldErrors.confirmPassword) || undefined}
                    />
                  </Field>
                </Field>
                {passwordError ? (
                  <FieldError>{passwordError}</FieldError>
                ) : (
                  <FieldDescription>Минимум {minPasswordLength} символов.</FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Создаём аккаунт…" : "Создать аккаунт"}
                </Button>
                <FieldError>{formError}</FieldError>
              </Field>
              <FieldDescription className="text-center">
                Уже есть аккаунт? <Link href={loginHref}>Войти</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <AuthImage />
        </CardContent>
      </Card>
      <LegalNotice action="Создать аккаунт" />
    </div>
  );
}
