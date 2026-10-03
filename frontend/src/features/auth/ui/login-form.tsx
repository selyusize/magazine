import Link from "next/link";
import type { SubmitEventHandler } from "react";

import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@shared/ui/field";
import { Input } from "@shared/ui/input";

import { AuthImage } from "./auth-image";
import { LegalNotice } from "./legal-notice";

export type LoginFormViewProps = {
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  isPending: boolean;
  fieldErrors: { email?: string; password?: string };
  formError?: string;
  registerHref: string;
};

/** Блок shadcn login-04. Только разметка: данные и обработчики приходят из model/use-login-form. */
export function LoginFormView({ onSubmit, isPending, fieldErrors, formError, registerHref }: LoginFormViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">С возвращением</h1>
                <p className="text-balance text-muted-foreground">Войдите в личный кабинет</p>
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
                <FieldError>{fieldErrors.email}</FieldError>
              </Field>
              <Field data-invalid={Boolean(fieldErrors.password) || undefined}>
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.password) || undefined}
                />
                <FieldError>{fieldErrors.password}</FieldError>
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Входим…" : "Войти"}
                </Button>
                <FieldError>{formError}</FieldError>
              </Field>
              <FieldDescription className="text-center">
                Нет аккаунта? <Link href={registerHref}>Зарегистрироваться</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <AuthImage />
        </CardContent>
      </Card>
      <LegalNotice action="Войти" />
    </div>
  );
}
