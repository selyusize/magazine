import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { newsletterSchema, NewsletterFormView } from "@features/newsletter";
import { routes, siteConfig } from "@shared/config";
import { errorMessages, getFieldErrors } from "@shared/lib/errors";
import { organizationJsonLd, toPhoneHref } from "@shared/lib/structured-data";
import { JsonLd } from "@shared/ui/json-ld";
import { Footer, FooterBottom, FooterColumns, FooterContacts, FooterSocials, formatCopyright } from "@widgets/footer";

function render(node: ReactNode) {
  const html = renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>);
  return { html, has: (slot: string) => html.includes(`data-slot="${slot}"`) };
}

const newsletterTexts = { title: "Рассылка", placeholder: "Email", submitLabel: "Подписаться", successMessage: "Готово" };

describe("Footer: регионы по умолчанию, скрытие и замена", () => {
  it("по умолчанию — контакты, колонки, подписка и копирайт из siteConfig", () => {
    const { html, has } = render(<Footer />);
    for (const slot of ["footer", "footer-contacts", "footer-column", "newsletter", "footer-bottom"]) {
      expect(has(slot), slot).toBe(true);
    }
    for (const column of siteConfig.footer.columns) {
      for (const link of column.links) expect(html).toContain(`href="${link.href}"`);
    }
    expect(html).toContain(formatCopyright(siteConfig.footer.copyright));
  });

  it("пустые соцсети в конфиге — региона нет", () => {
    expect(render(<Footer />).has("footer-socials")).toBe(siteConfig.socials.length > 0);
  });

  it("null скрывает регион, свой элемент заменяет стандартный", () => {
    const { html, has } = render(
      <Footer contacts={null} columns={null} newsletter={null} bottom={<span>bottom</span>} />,
    );
    expect(has("footer-contacts")).toBe(false);
    expect(has("footer-column")).toBe(false);
    expect(has("newsletter")).toBe(false);
    expect(html).toContain("<span>bottom</span>");
  });

  it("все регионы скрыты — остаётся пустая плашка без пустых обёрток", () => {
    const { html } = render(<Footer contacts={null} columns={null} newsletter={null} socials={null} bottom={null} />);
    expect(html).toMatch(/<div data-slot="container"[^>]*><\/div>/);
  });
});

describe("Footer: регионы", () => {
  it("колонка — nav, подписанный своим заголовком; ссылки списком", () => {
    const { html } = render(<FooterColumns columns={[{ title: "Компания", links: [{ label: "О нас", href: "/about" }] }]} />);
    const id = html.match(/<nav aria-labelledby="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`<p id="${id}"`);
    expect(html).toMatch(/<ul[^>]*><li><a[^>]*href="\/about"[^>]*>О нас<\/a><\/li><\/ul>/);
    expect(html).not.toMatch(/<h\d/);
  });

  it("контакты — <address>, tel: без форматирования, mailto:", () => {
    const { html } = render(<FooterContacts title="Контакты" phone="+7 (999) 123-45-67" email="a@b.ru" workingHours="Пн–Пт" />);
    expect(html).toContain("<address");
    expect(html).toContain('href="tel:+79991234567"');
    expect(html).toContain('href="mailto:a@b.ru"');
    expect(html).toContain("Пн–Пт");
  });

  it("контакты без данных — ничего не рендерится", () => {
    expect(render(<FooterContacts title="Контакты" />).html).toBe("");
  });

  it("соцсети: иконка с aria-label или текст, внешние ссылки с rel=me noopener", () => {
    const { html } = render(
      <FooterSocials
        items={[
          { label: "Instagram", href: "https://instagram.com/shop", icon: "instagram" },
          { label: "Telegram", href: "https://t.me/shop" },
        ]}
      />,
    );
    expect(html).toContain('aria-label="Instagram"');
    expect(html).toContain('data-icon="instagram"');
    expect(html).toMatch(/href="https:\/\/t.me\/shop"[^>]*>Telegram<\/a>/);
    expect(html).toContain('rel="me noopener noreferrer"');
  });

  it("нижняя строка: копирайт и юридические ссылки", () => {
    const { html } = render(<FooterBottom copyright="© 2026" legal={[{ label: "Оферта", href: "/offer" }]} />);
    expect(html).toContain("© 2026");
    expect(html).toContain('href="/offer"');
  });

  it("{year} в копирайте заменяется на год", () => {
    expect(formatCopyright("© {year} Shop", new Date("2031-05-01"))).toBe("© 2031 Shop");
  });
});

describe("Подписка на рассылку", () => {
  const base = { ...newsletterTexts, onSubmit: () => {}, isPending: false, isSubscribed: false };

  it("поле с подписью для скринридера, согласие со ссылками на документы", () => {
    const { html } = render(<NewsletterFormView {...base} />);
    const inputId = html.match(/<input[^>]*id="([^"]+)"/)?.[1];
    // shadcn FieldLabel: data-slot и sr-only, связь с полем через for
    expect(html).toMatch(new RegExp(`<label data-slot="field-label" class="[^"]*\\bsr-only\\b[^"]*" for="${inputId}">`));
    expect(html).toContain('type="email"');
    expect(html).toContain('autoComplete="email"');
    expect(html).toContain(`href="${routes.privacy}"`);
    expect(html).toContain(`href="${routes.terms}"`);
  });

  it("ошибка — aria-invalid и связанный текст ошибки", () => {
    const { html } = render(<NewsletterFormView {...base} emailError={errorMessages.email} />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain(errorMessages.email);
    expect(html).toContain('role="alert"');
  });

  it("после подписки — сообщение вместо формы", () => {
    const { html } = render(<NewsletterFormView {...base} isSubscribed />);
    expect(html).not.toContain("<form");
    expect(html).toContain('role="status"');
    expect(html).toContain(newsletterTexts.successMessage);
  });

  it("схема: неверный email — текст из общего словаря", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.ru" }).success).toBe(true);
    const { error } = newsletterSchema.safeParse({ email: "nope" });
    expect(getFieldErrors(error!)).toEqual({ email: errorMessages.email });
  });
});

describe("Разметка Organization (JSON-LD)", () => {
  const source = {
    name: "Shop",
    logo: { src: "/logo.svg", width: 1, height: 1 },
    contacts: { phone: "+7 (999) 123-45-67", email: "a@b.ru" },
    socials: [
      { label: "VK", href: "https://vk.com/shop" },
      { label: "Внутренняя", href: "/blog" },
    ],
  };

  it("абсолютные адреса, контакты и sameAs только из внешних ссылок", () => {
    expect(organizationJsonLd(source, "https://shop.ru")).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Shop",
      url: "https://shop.ru/",
      logo: "https://shop.ru/logo.svg",
      telephone: "+79991234567",
      email: "a@b.ru",
      contactPoint: { "@type": "ContactPoint", contactType: "customer service", telephone: "+79991234567", email: "a@b.ru" },
      sameAs: ["https://vk.com/shop"],
    });
  });

  it("без контактов и соцсетей — без пустых полей", () => {
    const data = organizationJsonLd({ ...source, contacts: {}, socials: [] }, "https://shop.ru");
    expect(data).not.toHaveProperty("contactPoint");
    expect(data).not.toHaveProperty("sameAs");
  });

  it("toPhoneHref оставляет только цифры и ведущий +", () => {
    expect(toPhoneHref("8 (800) 555-35-35")).toBe("88005553535");
    expect(toPhoneHref("+7 999 123-45-67")).toBe("+79991234567");
  });

  it("JsonLd экранирует </script> внутри данных", () => {
    const { html } = render(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    expect(html).toContain('type="application/ld+json"');
    expect(html).not.toContain("</script><script>");
  });
});
