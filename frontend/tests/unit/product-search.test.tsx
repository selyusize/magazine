import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { formatCount, formatEmpty, SearchField, SearchPanel, SearchResults, searchParamsSchema } from "@features/product-search";
import { fromStoreProduct, toCardProps } from "@entities/product";
import type { StoreProduct } from "@shared/api";
import { siteConfig } from "@shared/config";
import { paginationRange } from "@shared/lib/pagination";
import { plural } from "@shared/lib/plural";
import { websiteJsonLd } from "@shared/lib/structured-data";
import { productShelfMock } from "@widgets/product-shelf";

const search = siteConfig.search!;

describe("Поиск: параметры URL", () => {
  it("q обрезается и чистится, page по умолчанию 1", () => {
    expect(searchParamsSchema.parse({ q: "  брюки  " })).toEqual({ q: "брюки", page: 1 });
    expect(searchParamsSchema.parse({ q: ["a", "b"], page: "3" })).toEqual({ q: "a", page: 3 });
  });

  it("мусор в адресе не роняет страницу", () => {
    expect(searchParamsSchema.parse({ page: "-2" })).toEqual({ q: "", page: 1 });
    expect(searchParamsSchema.parse({ page: "abc", q: "x".repeat(500) }).q).toHaveLength(100);
  });
});

describe("Поиск: тексты", () => {
  it("склонение числа товаров", () => {
    expect([1, 3, 13, 21, 22, 25].map((n) => formatCount(n, search.countForms))).toEqual([
      "1 товар",
      "3 товара",
      "13 товаров",
      "21 товар",
      "22 товара",
      "25 товаров",
    ]);
    expect(plural(5, ["a", "b", "c"])).toBe("c");
  });

  it("пустой результат с запросом", () => {
    expect(formatEmpty("По «{query}» пусто", "брюки")).toBe("По «брюки» пусто");
  });
});

describe("Пагинация", () => {
  it("первая, последняя, текущая с соседями, многоточия", () => {
    expect(paginationRange(1, 1)).toEqual([1]);
    expect(paginationRange(1, 0)).toEqual([]);
    expect(paginationRange(2, 4)).toEqual([1, 2, 3, 4]);
    expect(paginationRange(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
    // Пропуск в одну страницу — номер, а не многоточие
    expect(paginationRange(4, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis", 12]);
  });
});

describe("Товар Medusa → карточка", () => {
  const product = {
    id: "prod_1",
    title: "Брюки из шёлка",
    handle: "silk-pant",
    thumbnail: "https://cdn/x.jpg",
    images: [],
    variants: [
      { calculatedPrice: { calculatedAmount: 24800, currencyCode: "rub" } },
      { calculatedPrice: { calculatedAmount: 19800, currencyCode: "rub" } },
    ],
  } as unknown as StoreProduct;

  it("ссылка, минимальная цена, alt по названию", () => {
    expect(fromStoreProduct(product)).toEqual({
      id: "prod_1",
      title: "Брюки из шёлка",
      href: "/products/silk-pant",
      price: { amount: 19800, currencyCode: "rub" },
      image: { src: "https://cdn/x.jpg", alt: "Брюки из шёлка" },
    });
  });

  it("без цен и фото — карточка без цены и картинки", () => {
    const bare = fromStoreProduct({ ...product, thumbnail: "", variants: [] } as unknown as StoreProduct);
    expect(bare.price).toBeUndefined();
    expect(bare.image).toBeUndefined();
    const html = renderToStaticMarkup(<SearchResults items={[toCardProps(bare)]} summary="1 товар" />);
    expect(html).not.toContain("<img");
    expect(html).toContain('href="/products/silk-pant"');
  });
});

describe("SearchResults", () => {
  const items = productShelfMock.items.slice(0, 4).map(toCardProps);

  it("подпись, ссылка «Смотреть все», карточка на каждый товар", () => {
    const html = renderToStaticMarkup(
      <SearchResults items={items} summary="13 товаров" viewAll={{ label: "Смотреть все", href: "/search?q=x" }} />,
    );
    expect(html).toContain("13 товаров");
    expect(html).toContain('href="/search?q=x"');
    expect(html.split('data-slot="product-card"')).toHaveLength(items.length + 1);
    expect(html).toContain("lg:grid-cols-4");
  });

  it("на странице поиска подпись — h2, колонки настраиваются", () => {
    const html = renderToStaticMarkup(<SearchResults items={items} summary="4 товара" summaryAs="h2" columns={6} />);
    expect(html).toMatch(/<h2[^>]*>4 товара<\/h2>/);
    expect(html).toContain("lg:grid-cols-6");
  });
});

describe("SearchField и SearchPanel без JS", () => {
  it("поле — GET-форма role=search с name=q", () => {
    const html = renderToStaticMarkup(<SearchField action="/search" label="Поиск" placeholder="Поиск…" defaultValue="брюки" />);
    expect(html).toMatch(/<form[^>]*action="\/search"/);
    expect(html).toContain('role="search"');
    expect(html).toContain('name="q"');
    expect(html).toContain('type="search"');
    expect(html).toContain('value="брюки"');
  });

  it("закрытая панель в HTML — только ссылка-иконка на страницу поиска", () => {
    const html = renderToStaticMarkup(<SearchPanel {...search} />);
    expect(html).toMatch(/<a[^>]*href="\/search"/);
    expect(html).toContain(`aria-label="${search.label}"`);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain("search-field");
  });
});

describe("JSON-LD WebSite", () => {
  it("SearchAction с шаблоном адреса поиска", () => {
    const data = websiteJsonLd(siteConfig, "https://shop.ru", "/search?q=");
    expect(data.potentialAction?.target.urlTemplate).toBe("https://shop.ru/search?q={search_term_string}");
    expect(websiteJsonLd(siteConfig, "https://shop.ru")).not.toHaveProperty("potentialAction");
  });
});
