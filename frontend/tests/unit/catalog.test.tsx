import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { catalogHref, catalogParamsSchema } from "@pages/catalog/model/params";
import { CatalogHeader } from "@pages/catalog/ui/catalog-header";
import {
  CatalogFilterView,
  filterGroups,
  filterQuery,
  filterSearchParams,
  parseFilters,
  toFilterSections,
  toRangeValue,
  type FilterGroup,
} from "@features/catalog-filter";
import { resolveSort, sortMenuItems } from "@features/catalog-sort";
import { WishlistButton } from "@features/wishlist-toggle";
import { fromStoreCategory } from "@entities/category";
import { ProductCard, searchPriceField, toProductFacets, toSearchOrder } from "@entities/product";
import type { StoreProductCategory } from "@shared/api";
import { siteConfig, type CatalogFilter } from "@shared/config";
import { breadcrumbJsonLd } from "@shared/lib/structured-data";

const { sort: sortOptions } = siteConfig.catalog;

describe("Каталог: параметры URL", () => {
  it("page по умолчанию 1, sort — как есть, мусор не роняет страницу", () => {
    expect(catalogParamsSchema.parse({})).toEqual({ page: 1, sort: undefined });
    expect(catalogParamsSchema.parse({ page: ["3", "4"], sort: "new" })).toEqual({ page: 3, sort: "new" });
    expect(catalogParamsSchema.parse({ page: "-1", sort: ["a", "b"] })).toEqual({ page: 1, sort: "a" });
  });

  it("у выдачи по умолчанию один адрес без параметров", () => {
    expect(catalogHref("/catalog/dresses", {})).toBe("/catalog/dresses");
    expect(catalogHref("/catalog/dresses", { page: 1 })).toBe("/catalog/dresses");
    expect(catalogHref("/catalog/dresses", { page: 2, sort: "new" })).toBe("/catalog/dresses?sort=new&page=2");
  });
});

describe("Каталог: сортировка", () => {
  it("неизвестное значение — вариант по умолчанию", () => {
    expect(resolveSort("new", sortOptions)?.order).toBe("-created_at");
    expect(resolveSort("hack", sortOptions)).toBe(sortOptions[0]);
    expect(resolveSort(undefined, [])).toBeUndefined();
  });

  it("пункт по умолчанию ведёт на адрес без ?sort, текущий отмечен", () => {
    const items = sortMenuItems(sortOptions, sortOptions[1], (value) => catalogHref("/catalog", { sort: value }));
    expect(items[0]).toMatchObject({ href: "/catalog", active: false });
    expect(items[1]).toMatchObject({ href: "/catalog?sort=new", active: true });
  });
});

describe("Каталог: категории", () => {
  it("подкатегории по rank, ссылки из routes", () => {
    const category = fromStoreCategory({
      id: "c1",
      name: "Одежда",
      handle: "clothing",
      description: "",
      parentCategory: null,
      categoryChildren: [
        { id: "c3", name: "Юбки", handle: "skirts", rank: 2 },
        { id: "c2", name: "Платья", handle: "dresses", rank: 1 },
      ],
    } as unknown as StoreProductCategory);

    expect(category.href).toBe("/catalog/clothing");
    expect(category.description).toBeUndefined();
    expect(category.parent).toBeUndefined();
    expect(category.children.map((child) => child.name)).toEqual(["Платья", "Юбки"]);
  });

  it("хлебные крошки — абсолютные адреса по порядку", () => {
    const data = breadcrumbJsonLd(
      [
        { name: "Каталог", href: "/catalog" },
        { name: "Платья", href: "/catalog/dresses" },
      ],
      "https://shop.example",
    );
    expect(data.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Платья",
      item: "https://shop.example/catalog/dresses",
    });
  });
});

describe("Каталог: разметка", () => {
  it("h1, чипсы-ссылки с текущей, панель сортировки", () => {
    const html = renderToStaticMarkup(
      <CatalogHeader
        title="Одежда"
        chips={[
          { label: "Платья", href: "/catalog/dresses", active: true },
          { label: "Юбки", href: "/catalog/skirts" },
        ]}
        sort={<button type="button">Сортировка</button>}
      />,
    );
    expect(html).toContain("<h1");
    expect(html).toMatch(/aria-current="page"[^>]*href="\/catalog\/dresses"/);
    expect(html).toContain('href="/catalog/skirts"');
    expect(html).toContain("Сортировка");
  });

  it("кнопка «назад» у заголовка — ссылка на раздел выше с подписью", () => {
    const html = renderToStaticMarkup(<CatalogHeader title="Платья" back={{ label: "Одежда", href: "/catalog/clothing" }} />);
    expect(html).toMatch(/href="\/catalog\/clothing"[^>]*aria-label="Назад: Одежда"|aria-label="Назад: Одежда"[^>]*href="\/catalog\/clothing"/);
    expect(html).toContain('data-icon="caret-left"');
    expect(renderToStaticMarkup(<CatalogHeader title="Каталог" />)).not.toContain("caret-left");
  });

  it("без чипсов и сортировки — только заголовок", () => {
    const html = renderToStaticMarkup(<CatalogHeader title="Каталог" />);
    expect(html).not.toContain("<ul");
    expect(html).not.toContain("grid-cols-2");
  });

  it("сердечко: подпись с названием, состояние в aria-pressed", () => {
    const off = renderToStaticMarkup(<WishlistButton active={false} onToggle={() => {}} title="Платье" />);
    const on = renderToStaticMarkup(<WishlistButton active onToggle={() => {}} title="Платье" />);
    expect(off).toContain('aria-pressed="false"');
    expect(off).toContain('data-icon="heart"');
    expect(on).toContain('data-icon="heart-fill"');
    expect(on).toContain('aria-label="Платье: в избранное"');
  });

  it("карточка: слот избранного на фото и свои пропорции", () => {
    const html = renderToStaticMarkup(
      <ProductCard
        title="Платье"
        href="/products/dress"
        sizes="50vw"
        imageClassName="aspect-161/220"
        favorite={<button type="button">fav</button>}
      />,
    );
    expect(html).toContain("aspect-161/220");
    expect(html).not.toContain("aspect-250/280");
    expect(html).toContain("fav");
  });
});

const filters: CatalogFilter[] = [
  { key: "color", label: "Цвет", type: "color", source: { option: "Color" }, swatches: { Red: "#f00", Black: "#000" } },
  { key: "material", label: "Материал", type: "radio", source: { option: "Material" } },
  { key: "size", label: "Размер", type: "checkbox", source: { option: "Size" }, labels: { S: "S", M: "M", L: "L" } },
  { key: "tag", label: "Метки", type: "checkbox", source: { field: "labels" } },
  { key: "price", label: "Цена", type: "range", source: "price", step: 10 },
];

const index = { priceField: "min_price_eur", currencyCode: "eur" };

describe("Каталог: фильтры в URL", () => {
  it("значения по конфигу: radio — одно, range — нормализуется, мусор и чужие ключи отбрасываются", () => {
    const state = parseFilters(
      { color: ["Red", "Red", " "], material: ["Silk", "Wool"], size: "M", price: "500-100", other: "x", tag: [""] },
      filters,
    );
    expect(state).toEqual({ color: ["Red"], material: ["Silk"], size: ["M"], price: ["100-500"] });
    expect(parseFilters({ price: ["abc", "-300"] }, filters)).toEqual({ price: ["-300"] });
    expect(parseFilters({ price: "-" }, filters)).toEqual({});
  });

  it("порядок параметров — как в конфиге, фильтры живут в адресах сортировки и пагинации", () => {
    const params = filterSearchParams({ size: ["S", "M"], color: ["Red"] }, filters);
    expect(params).toEqual([["color", "Red"], ["size", "S"], ["size", "M"]]);
    expect(catalogHref("/catalog", { page: 2, sort: "new", filters: params })).toBe("/catalog?sort=new&color=Red&size=S&size=M&page=2");
  });
});

describe("Каталог: фильтры в поисковом индексе", () => {
  it("условия: опции — `Название:значение`, цена — границы в валюте региона; фасеты без дублей", () => {
    const { clauses, facets } = filterQuery(filters, { color: ["Red"], size: ["S", "M"], price: ["-300"] }, index);
    expect(clauses).toEqual([
      { option_values: { $in: ["Color:Red"] } },
      { option_values: { $in: ["Size:S", "Size:M"] } },
      { min_price_eur: { $lte: 300 } },
    ]);
    expect(facets).toEqual([
      { field: "option_values", limit: 200 },
      { field: "labels", limit: 200 },
      { field: "min_price_eur", type: "stats" },
    ]);
  });

  it("валюты нет в индексе — фильтра по цене нет", () => {
    expect(searchPriceField("EUR")).toBeUndefined();
    expect(searchPriceField("RUB")).toBe("min_price_rub");
    const { clauses, facets } = filterQuery(filters, { price: ["100-200"] }, {});
    expect(clauses).toEqual([]);
    expect(facets).not.toContainEqual(expect.objectContaining({ type: "stats" }));
  });

  it("фасеты из ответа: ключи — имена полей индекса, битые отброшены; сортировка — в формате индекса", () => {
    expect(
      toProductFacets({
        optionValues: { type: "value", values: [{ value: "Size:S", count: 2 }] },
        minPriceEur: { type: "stats", min: 10, max: 99 },
        labels: { type: "stats", min: null, max: null },
      }),
    ).toEqual({
      option_values: { type: "value", values: [{ value: "Size:S", count: 2 }] },
      min_price_eur: { type: "stats", min: 10, max: 99 },
    });
    expect(toSearchOrder("-created_at")).toEqual({ created_at: "DESC" });
    expect(toSearchOrder("title")).toEqual({ title: "ASC" });
    expect(toSearchOrder(undefined)).toBeUndefined();
  });

  it("секции: порядок подписей конфига, выбранное без товаров остаётся, пустые секции скрыты", () => {
    const groups = filterGroups(
      filters,
      { size: ["L"] },
      {
        option_values: {
          type: "value",
          values: [
            { value: "Color:Black", count: 3 },
            { value: "Color:Navy", count: 1 },
            { value: "Color:Red", count: 1 },
            { value: "Size:M", count: 4 },
            { value: "Size:S", count: 2 },
          ],
        },
        min_price_eur: { type: "stats", min: 12, max: 87 },
      },
      index,
    );

    expect(groups.map((group) => group.key)).toEqual(["color", "size", "price"]);
    expect(groups[0]).toMatchObject({
      type: "color",
      options: [
        { value: "Red", color: "#f00", count: 1 },
        { value: "Black", color: "#000", count: 3 },
        { value: "Navy", count: 1 },
      ],
    });
    expect(groups[1]).toMatchObject({ options: [{ value: "S" }, { value: "M" }, { value: "L", count: 0 }] });
    expect(groups[2]).toMatchObject({ type: "range", min: 10, max: 90, step: 10 });
  });
});

describe("Каталог: шторка фильтров", () => {
  const range: Extract<FilterGroup, { type: "range" }> = { type: "range", key: "price", label: "Цена", min: 0, max: 100, step: 1, currencyCode: "eur" };

  it("слайдер: весь разброс — без фильтра, крайняя граница — открытая", () => {
    expect(toRangeValue(range, [0, 100])).toBeUndefined();
    expect(toRangeValue(range, [20, 100])).toBe("20-");
    expect(toRangeValue(range, [0, 80])).toBe("-80");
    expect(toRangeValue(range, [20, 80])).toBe("20-80");
  });

  it("секции черновика: выбор и подписи границ в валюте", () => {
    const [section] = toFilterSections([range], { price: ["-40"] });
    expect(section).toMatchObject({ value: [0, 40] });
    expect(section?.type === "range" && section.valueLabels[1]).toMatch(/40\s€/);
  });

  it("кнопка показывает число выбранных значений", () => {
    const html = renderToStaticMarkup(
      <CatalogFilterView
        label="Фильтры"
        applyLabel="Показать"
        resetLabel="Сбросить"
        open={false}
        onOpenChange={() => {}}
        sections={[]}
        activeCount={2}
        canReset
        onValuesChange={() => {}}
        onRangeChange={() => {}}
        onReset={() => {}}
        onApply={() => {}}
      />,
    );
    expect(html).toContain("Фильтры (2)");
    expect(html).toContain('aria-haspopup="dialog"');
  });
});
