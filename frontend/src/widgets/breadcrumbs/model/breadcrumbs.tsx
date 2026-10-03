import { headers } from "next/headers";

import { env, siteConfig } from "@shared/config";
import { breadcrumbJsonLd } from "@shared/lib/structured-data";
import { JsonLd } from "@shared/ui/json-ld";

import { BreadcrumbsView } from "../ui/breadcrumbs-view";
import { buildTrail, type Crumb } from "./trail";

export type BreadcrumbsProps = {
  /** Разделы от корня раздела до текущей страницы, без главной: `[{ name: "Каталог", href: "/catalog" }, …]` */
  items: Crumb[];
  /** Разметка BreadcrumbList для поисковиков. false — для страниц вне индекса (поиск, корзина) */
  jsonLd?: boolean;
  /** false — без кнопки «назад», только цепочка: у страницы своя кнопка (каталог). По умолчанию — как в конфиге */
  back?: boolean;
  className?: string;
};

/**
 * Хлебные крошки страницы: цепочка (или кнопка «назад») и разметка BreadcrumbList. Серверный компонент.
 * Главная, подписи и режим кнопки — из siteConfig.breadcrumbs; null там — ничего не выводится.
 *
 * @example Категория каталога
 * <Breadcrumbs items={[{ name: "Каталог", href: "/catalog" }, { name: "Платья", href: "/catalog/dresses" }]} />
 */
export async function Breadcrumbs({ items, jsonLd = true, back = true, className }: BreadcrumbsProps) {
  const config = siteConfig.breadcrumbs;
  const trail = config && buildTrail(items, config);
  if (!config || !trail) return null;

  // nonce — для CSP, как у JSON-LD в корневом layout
  const nonce = jsonLd ? ((await headers()).get("x-nonce") ?? undefined) : undefined;

  return (
    <>
      <BreadcrumbsView
        label={config.label}
        items={trail.items}
        back={back ? trail.back : undefined}
        backMode={config.back === "always" ? "always" : "mobile"}
        className={className}
      />
      {jsonLd ? <JsonLd data={breadcrumbJsonLd(trail.items, env.siteUrl)} nonce={nonce} /> : null}
    </>
  );
}
