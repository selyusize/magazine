import type { SiteConfig } from "@shared/config";

/**
 * Разметка schema.org (JSON-LD) для поисковиков. Только чистые функции: данные из siteConfig → объект.
 * Выводится компонентом <JsonLd> из shared/ui.
 */

/** Телефон для tel: и schema.org — только цифры и ведущий +: «+7 (000) 000-00-00» → «+70000000000». */
export function toPhoneHref(phone: string): string {
  return phone.replace(/(?!^\+)[^\d]/g, "");
}

/** Абсолютный адрес: в JSON-LD относительные ссылки не допускаются. */
export function absolute(path: string, siteUrl: string): string {
  return new URL(path, `${siteUrl}/`).toString();
}

type OrganizationSource = Pick<SiteConfig, "name" | "logo" | "contacts" | "socials">;

/**
 * Organization: название, логотип, контакты и соцсети магазина.
 * Яндекс и Google берут отсюда карточку организации и связывают сайт с соцсетями (sameAs).
 */
export function organizationJsonLd({ name, logo, contacts, socials }: OrganizationSource, siteUrl: string) {
  const { phone, email, address } = contacts;
  const sameAs = socials.map((social) => social.href).filter((href) => /^https?:\/\//.test(href));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: absolute("/", siteUrl),
    logo: absolute(logo.src, siteUrl),
    ...(phone && { telephone: toPhoneHref(phone) }),
    ...(email && { email }),
    ...(address && { address }),
    ...((phone || email) && {
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        ...(phone && { telephone: toPhoneHref(phone) }),
        ...(email && { email }),
      },
    }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

type WebSiteSource = Pick<SiteConfig, "name" | "locale">;

/**
 * WebSite: название сайта в выдаче и шаблон поиска по сайту (SearchAction).
 * searchPath — путь поиска с параметром: `/search?q=`, к нему дописывается {search_term_string}.
 */
export function websiteJsonLd({ name, locale }: WebSiteSource, siteUrl: string, searchPath?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: absolute("/", siteUrl),
    inLanguage: locale,
    ...(searchPath && {
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${absolute(searchPath, siteUrl)}{search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    }),
  };
}

/**
 * BreadcrumbList: цепочка «Каталог → Одежда → Платья» вместо URL в сниппете Яндекса и Google.
 * items — от корня к текущей странице, href относительные.
 */
export function breadcrumbJsonLd(items: { name: string; href: string }[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.href, siteUrl),
    })),
  };
}
