import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { siteConfig } from "@shared/config";

import { Providers } from "./providers";
import "@app/styles/globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s — ${siteConfig.name}` },
  description: siteConfig.description,
};

/**
 * Корень документа: html/body, шрифты, провайдеры. Хедер и футер — в вариантах лайаута (shop, checkout).
 * Чтение заголовков делает все страницы динамическими: nonce для CSP (proxy.ts) свой у каждого запроса,
 * в статически собранной странице его не было бы — и браузер заблокировал бы скрипты.
 */
export async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={siteConfig.locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
