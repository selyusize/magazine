import { AppShell } from "@shared/ui/app-shell";

/** Вход и регистрация: полноэкранные формы без хедера и футера. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AppShell layout="auth">{children}</AppShell>;
}
