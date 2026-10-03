import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BreadcrumbsView, buildTrail } from "@widgets/breadcrumbs";
import type { BreadcrumbsConfig } from "@shared/config";

const config: BreadcrumbsConfig = { label: "Навигационная цепочка", home: "Главная", back: "mobile" };
const catalog = { name: "Каталог", href: "/catalog" };
const dresses = { name: "Платья", href: "/catalog/dresses" };

describe("Хлебные крошки: цепочка", () => {
  it("главная — первой, кнопка «назад» ведёт на родителя", () => {
    expect(buildTrail([catalog, dresses], config)).toEqual({
      items: [{ name: "Главная", href: "/" }, catalog, dresses],
      back: catalog,
    });
  });

  it("без главной в конфиге и с выключенной кнопкой", () => {
    expect(buildTrail([catalog, dresses], { ...config, home: null, back: "never" })).toEqual({ items: [catalog, dresses] });
  });

  it("одна крошка — не цепочка; пустые и повторы подряд отброшены", () => {
    expect(buildTrail([catalog], { ...config, home: null })).toBeNull();
    expect(buildTrail([{ name: "Главная", href: "/" }], config)).toBeNull();
    expect(buildTrail([catalog, { name: "", href: "/x" }, catalog], config)?.items).toEqual([{ name: "Главная", href: "/" }, catalog]);
  });
});

describe("Хлебные крошки: разметка", () => {
  const items = [{ name: "Главная", href: "/" }, catalog, dresses];

  it("ссылки на разделы, текущая — без ссылки, разделители вне пунктов списка", () => {
    const html = renderToStaticMarkup(<BreadcrumbsView label={config.label} items={items} />);
    expect(html).toContain('aria-label="Навигационная цепочка"');
    expect(html).toContain('href="/catalog"');
    expect(html).not.toContain('href="/catalog/dresses"');
    expect(html).toMatch(/aria-current="page"[^>]*>Платья/);
    expect(html).not.toMatch(/<li[^>]*>(?:(?!<\/li>).)*<li/);
  });

  it("назад: на мобильных вместо цепочки или везде", () => {
    const mobile = renderToStaticMarkup(<BreadcrumbsView label="" items={items} back={catalog} />);
    expect(mobile).toMatch(/href="\/catalog"[^>]*md:hidden|md:hidden[^>]*href="\/catalog"/);
    expect(mobile).toContain("md:flex");
    expect(mobile).toContain('data-icon="caret-left"');

    const always = renderToStaticMarkup(<BreadcrumbsView label="" items={items} back={catalog} backMode="always" />);
    expect(always).not.toContain("md:hidden");
    expect(always).not.toContain("md:flex");
  });
});
