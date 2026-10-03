import type { Metadata } from "next";
import { headers } from "next/headers";

import { env, routes, siteConfig } from "@shared/config";
import { organizationJsonLd, websiteJsonLd } from "@shared/lib/structured-data";
import { JsonLd } from "@shared/ui/json-ld";

import { brandFont } from "@app/styles/fonts";

import { Providers } from "./providers";
import "@app/styles/globals.css";

export const metadata: Metadata = {
  // Относительные canonical / Open Graph из generateMetadata страниц станут абсолютными
  metadataBase: new URL(env.siteUrl),
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
      className={`${brandFont.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers nonce={nonce}>{children}</Providers>
        <JsonLd data={organizationJsonLd(siteConfig, env.siteUrl)} nonce={nonce} />
        <JsonLd data={websiteJsonLd(siteConfig, env.siteUrl, siteConfig.search ? `${routes.search()}?q=` : undefined)} nonce={nonce} />
      </body>
    </html>
  );
}
