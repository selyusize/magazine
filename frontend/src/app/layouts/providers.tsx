"use client";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

import { getQueryClient } from "@shared/api";
import { Toaster } from "@shared/ui/sonner";
import { TooltipProvider } from "@shared/ui/tooltip";

/** nonce — для инлайн-скрипта next-themes (CSP, см. proxy.ts). */
export function Providers({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider nonce={nonce} attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
