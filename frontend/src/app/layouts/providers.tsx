"use client";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

import { getQueryClient } from "@shared/api";
import { siteConfig } from "@shared/config";
import { Toaster } from "@shared/ui/sonner";
import { TooltipProvider } from "@shared/ui/tooltip";

/**
 * Скрипт темы next-themes нужен только в серверном HTML: он ставит класс темы до гидратации, без мигания.
 * На клиенте React скрипты не выполняет и предупреждает о каждом `<script>` в дереве — там он помечается
 * блоком данных. Расхождение атрибута при гидратации next-themes гасит сам (suppressHydrationWarning).
 */
const themeScriptProps = typeof window === "undefined" ? undefined : ({ type: "application/json" } as const);

/** nonce — для инлайн-скрипта next-themes (CSP, см. proxy.ts). */
export function Providers({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        nonce={nonce}
        scriptProps={themeScriptProps}
        attribute="class"
        defaultTheme={siteConfig.theme}
        enableSystem={siteConfig.theme === "system"}
        disableTransitionOnChange
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === "development" && (
        <TanStackDevtools
          plugins={[{ name: "TanStack Query", render: <ReactQueryDevtoolsPanel client={queryClient} /> }]}
        />
      )}
    </QueryClientProvider>
  );
}
