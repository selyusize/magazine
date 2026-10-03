import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { cartKeys } from "@entities/cart";
import type { StoreCart } from "@shared/api";
import { siteConfig, type NavLink } from "@shared/config";
import { AppShell } from "@shared/ui/app-shell";
import { Container } from "@shared/ui/container";
import { Header, HeaderActionsView, HeaderNavigation } from "@widgets/header";

/** Корзина в кеше TanStack Query: две позиции по 1 и 2 штуки — счётчик 3 */
const cart = {
  currencyCode: "rub",
  itemTotal: 3000,
  items: [
    { id: "a", title: "A", quantity: 1, unitPrice: 1000 },
    { id: "b", title: "B", quantity: 2, unitPrice: 1000 },
  ],
} as StoreCart;

function render(node: ReactNode) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(cartKeys.current(), cart);
  const html = renderToStaticMarkup(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>);
  return { html, has: (slot: string) => html.includes(`data-slot="${slot}"`) };
}

describe("AppShell: каркас страницы", () => {
  it("header / main / footer в landmark-тегах, main с id для skip-link", () => {
    const { html } = render(
      <AppShell header="H" footer="F">
        content
      </AppShell>,
    );
    expect(html).toMatch(/<header data-slot="app-header"[^>]*>H<\/header>/);
    expect(html).toMatch(/<main id="main" data-slot="app-main"[^>]*>content<\/main>/);
    expect(html).toContain('<footer data-slot="app-footer">F</footer>');
    expect(html).toContain('href="#main"');
  });

  it("без header / footer — соответствующих тегов нет", () => {
    const { html } = render(<AppShell footer={null}>content</AppShell>);
    expect(html).not.toContain("<header");
    expect(html).not.toContain("<footer");
    expect(html).toContain("<main");
  });

  it("вариант лайаута и липкий хедер отражаются в data-атрибутах", () => {
    const { html } = render(
      <AppShell layout="checkout" header="H" stickyHeader>
        x
      </AppShell>,
    );
    expect(html).toContain('data-layout="checkout"');
    expect(html).toContain('data-sticky="true"');
  });

  it("Container: размер по умолчанию и свой", () => {
    expect(render(<Container>x</Container>).html).toContain('data-size="default"');
    expect(render(<Container size="full">x</Container>).html).toContain('data-size="full"');
  });
});

describe("Header: регионы по умолчанию, скрытие и замена", () => {
  it("по умолчанию — промо-полоса, логотип, навигация, поиск и действия из siteConfig", () => {
    const { html, has } = render(<Header />);
    // header.search.variant = "panel": иконка поиска — триггер панели из features/product-search
    for (const slot of ["header-top-bar", "header-logo", "header-navigation", "search-panel-trigger", "header-actions"]) {
      expect(has(slot), slot).toBe(true);
    }
    expect(html).toContain('data-variant="inline"');
    expect(html).toContain(`alt="${siteConfig.name}"`);
  });

  it("навигация: nav с подписью, ссылки в списке, вложенные пункты в HTML", () => {
    const { html } = render(<Header />);
    expect(html).toContain('<nav aria-label="Основная навигация"');
    for (const item of siteConfig.header.navigation) {
      expect(html).toContain(`href="${item.href}"`);
      for (const child of item.children ?? []) {
        expect(html).toContain(`href="${child.href}"`);
        for (const link of child.children ?? []) expect(html).toContain(`href="${link.href}"`);
      }
    }
  });

  it("пункт с группами — мега-меню: группы, их ссылки и фото в серверном HTML", () => {
    const items: NavLink[] = [
      {
        label: "Каталог",
        href: "/catalog",
        children: [{ label: "Категории", href: "/catalog", children: [{ label: "Сумки", href: "/catalog/bags" }] }],
        image: { src: "/images/menu/catalog.jpg", alt: "Фото подборки" },
      },
      { label: "Журнал", href: "/journal", children: [{ label: "Статьи", href: "/journal/articles" }] },
    ];
    const { html } = render(<HeaderNavigation items={items} />);
    expect(html.split('data-slot="header-mega-menu"').length - 1).toBe(1);
    expect(html).toContain('href="/catalog/bags"');
    expect(html).toContain('alt="Фото подборки"');
    // Простой список остаётся выпадающим, а не мега-меню
    expect(html).toContain('href="/journal/articles"');
  });

  it("shadcn NavigationMenu: закрытые панели в серверном HTML, ссылка пункта списка не теряется", () => {
    const items: NavLink[] = [
      { label: "Журнал", href: "/journal", children: [{ label: "Статьи", href: "/journal/articles" }] },
      { label: "Новинки", href: "/new" },
    ];
    const { html } = render(<HeaderNavigation items={items} />);
    expect(html).toContain('data-slot="navigation-menu-content"');
    expect(html).toMatch(/data-state="closed"[^>]*data-slot="navigation-menu-content"|data-slot="navigation-menu-content"[^>]*data-state="closed"/);
    // Пункт с подменю — ссылка на свой раздел и триггер меню shadcn одновременно
    expect(html).toMatch(/<a[^>]*data-slot="navigation-menu-trigger"[^>]*href="\/journal">Журнал/);
    expect(html).toContain('href="/journal"');
    expect(html).toContain('href="/new"');
  });

  it("иконки-ссылки подписаны, счётчик входит в подпись", () => {
    const { html } = render(<Header />);
    expect(html).toContain('aria-label="Поиск"');
    expect(html).toContain('aria-label="Корзина: 3"');
    expect(html).toContain('aria-label="Открыть меню"');
  });

  it("корзина с panel — кнопка шторки, а не ссылка; без шторки — ссылка", () => {
    const { html } = render(<Header />);
    expect(html).toMatch(/<button[^>]*aria-label="Корзина: 3"[^>]*>/);
    expect(html).not.toContain(`href="${siteConfig.header.actions.find((item) => item.panel)?.href}"`);
    const links = render(<HeaderActionsView items={siteConfig.header.actions} counters={{ cart: 3 }} />).html;
    expect(links).toMatch(/<a[^>]*aria-label="Корзина: 3"[^>]*>/);
    expect(links).toContain('href="/cart"');
  });

  it("null скрывает регион (минимальный хедер оформления заказа)", () => {
    const { has } = render(<Header topBar={null} menu={null} navigation={null} search={null} actions={null} />);
    expect(has("header-logo")).toBe(true);
    for (const slot of ["header-top-bar", "header-menu-trigger", "header-navigation", "header-search", "search-panel-trigger", "header-actions"]) {
      expect(has(slot), slot).toBe(false);
    }
  });

  it("свой элемент заменяет стандартный регион, вариант раскладки переопределяется", () => {
    const { html, has } = render(<Header variant="centered" logo={<span>logo</span>} search={null} />);
    expect(html).toContain("<span>logo</span>");
    expect(html).toContain('data-variant="centered"');
    expect(has("header-logo")).toBe(false);
    expect(has("header-search") || has("search-panel-trigger")).toBe(false);
  });
});
