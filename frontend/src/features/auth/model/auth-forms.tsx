"use client";

import { LoginFormView } from "../ui/login-form";
import { SignupFormView } from "../ui/signup-form";
import { useLoginForm } from "./use-login-form";
import { useSignupForm } from "./use-signup-form";

// Связка: логика из model + «тупые» представления из ui. Страницы используют эти компоненты.

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  return <LoginFormView {...useLoginForm({ redirectTo })} />;
}

export function SignupForm({ redirectTo }: { redirectTo?: string }) {
  return <SignupFormView {...useSignupForm({ redirectTo })} />;
}
