import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { formatPrice } from "@shared/lib/format-price";
import { ProductShelf, ProductShelfView, productShelfMock } from "@widgets/product-shelf";

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("ProductShelf: подборка товаров", () => {
  it("секция с h2 и карточкой-ссылкой на каждый товар", () => {
    const html = renderToStaticMarkup(<ProductShelf />);
    expect(html).toContain(`<h2 class="p-4 text-600">${productShelfMock.title}</h2>`);
    expect(count(html, 'data-slot="product-card"')).toBe(productShelfMock.items.length);
    for (const item of productShelfMock.items) {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(item.title);
    }
  });

  it("цена отформатирована в рублях", () => {
    const html = renderToStaticMarkup(<ProductShelf items={productShelfMock.items.slice(0, 1)} />);
    expect(html).toContain(formatPrice(29800, "rub"));
    expect(formatPrice(29800, "rub")).toMatch(/^29\s800\s₽$/);
    expect(formatPrice(99.5, "rub")).toMatch(/^99,50\s₽$/);
  });

  it("цвета подписаны для скринридеров, без цветов — без списка", () => {
    const withColors = productShelfMock.items.filter((item) => item.colors);
    const html = renderToStaticMarkup(<ProductShelf items={withColors} />);
    expect(html).toContain('aria-label="Цвета"');
    expect(html).toContain('<span class="sr-only">Кэмел</span>');
    const plain = renderToStaticMarkup(<ProductShelf items={productShelfMock.items.slice(0, 1)} />);
    expect(plain).not.toContain('aria-label="Цвета"');
  });

  it("пустой список — секции нет, title=null — без заголовка", () => {
    expect(renderToStaticMarkup(<ProductShelf items={[]} />)).toBe("");
    expect(renderToStaticMarkup(<ProductShelf title={null} />)).not.toContain("<h2");
  });

  it("centered: заголовок по центру, черта над секцией только с divided", () => {
    const html = renderToStaticMarkup(<ProductShelf title="Носите с" layout="centered" />);
    expect(html).toContain('<h2 class="p-4 text-600 text-center">Носите с</h2>');
    expect(html).toContain("lg:grid-cols-3");
    expect(html).not.toContain('data-slot="separator"');
    const divided = renderToStaticMarkup(<ProductShelfView items={[]} title="Вы недавно смотрели" layout="centered" divided />);
    expect(divided).toContain('data-slot="separator"');
  });
});
