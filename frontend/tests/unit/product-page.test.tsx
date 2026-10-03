import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { pageNumberSchema, productParamsSchema, reviewsHref } from "@pages/product/model/params";
import { minPrice, productSeo, toMetaDescription } from "@pages/product/model/seo";
import { HighlightsView } from "@widgets/highlights";
import { LookbookView } from "@widgets/lookbook";
import { ProductDetailsView, toDetailSections } from "@widgets/product-details";
import { ProductOverviewView } from "@widgets/product-overview";
import { ProductReviews } from "@widgets/product-reviews";
import { toPickerGroups, VariantPickerView } from "@features/variant-picker";
import {
  findVariant,
  firstMissingOption,
  fromStoreProductDetail,
  initialSelection,
  optionValueState,
  ProductPrice,
  productHighlights,
  productJsonLd,
  productLookbook,
  productRelatedHandles,
  selectionImages,
  selectionPrice,
  selectOptionValue,
  type ProductDetail,
} from "@entities/product";
import { listProductReviews, reviewsJsonLd } from "@entities/review";
import type { StoreProduct } from "@shared/api";
import { siteConfig, type ProductOptionConfig, type ProductSection } from "@shared/config";
import { RatingStars } from "@shared/ui/rating-stars";

const image = (url: string, rank: number, alt?: string) => ({ id: url, url, rank, metadata: alt ? { alt } : null });
const price = (amount: number, originalAmount = amount) => ({ calculatedAmount: amount, originalAmount, currencyCode: "rub" });

/** Свитер: 2 цвета × 2 размера. Чёрный M закончился, бежевого L нет вовсе */
function variant(id: string, color: string, size: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    title: `${color} / ${size}`,
    sku: `SW-${id}`,
    ean: "",
    upc: "",
    barcode: "",
    manageInventory: true,
    allowBackorder: false,
    inventoryQuantity: 5,
    calculatedPrice: price(24_800),
    options: [
      { id: `${id}-c`, value: color, optionId: "opt_color" },
      { id: `${id}-s`, value: size, optionId: "opt_size" },
    ],
    images: [],
    ...extra,
  };
}

const storeProduct = {
  id: "prod_1",
  handle: "alpaca-sweater",
  title: "Свитер из альпаки",
  subtitle: "",
  description: "Мягкий свитер\nиз альпаки.\n\nВязка косами.",
  thumbnail: "https://cdn.example/thumb.jpg",
  material: "Альпака, шерсть",
  originCountry: "IT",
  weight: 450,
  length: 0,
  width: 0,
  height: 0,
  metadata: { fit: "Свободный крой.\n\nМодель на фото носит S.", composition: "60% альпака, 40% шерсть" },
  images: [image("https://cdn.example/2.jpg", 1), image("https://cdn.example/1.jpg", 0, "Свитер спереди")],
  options: [
    { id: "opt_size", title: "Size", values: [{ value: "L", rank: 1 }, { value: "M", rank: 0 }] },
    { id: "opt_color", title: "Color", values: [{ value: "Beige", rank: 0 }, { value: "Black", rank: 1 }] },
  ],
  variants: [
    variant("1", "Beige", "M", { images: [image("https://cdn.example/beige.jpg", 0)] }),
    variant("2", "Black", "M", { inventoryQuantity: 0 }),
    variant("3", "Black", "L", { calculatedPrice: price(19_840, 24_800) }),
  ],
  categories: [
    { id: "c2", name: "Свитеры", handle: "sweaters", parentCategory: { id: "c1", name: "Одежда", handle: "clothing", parentCategory: null } },
  ],
  collection: null,
  type: null,
} as unknown as StoreProduct;

const product = fromStoreProductDetail(storeProduct);

const options: ProductOptionConfig[] = [
  { option: "Color", label: "Цвет", type: "color", swatches: { Beige: "#cfac94" }, labels: { Beige: "Бежевый", Black: "Чёрный" }, preselect: true, schemaProperty: "color" },
  { option: "Size", label: "Размер", type: "button", schemaProperty: "size" },
];

describe("Товар: данные из Medusa", () => {
  it("опции и фото — по rank, описание — абзацами, крошки — от верхней категории", () => {
    expect(product.options.map((option) => option.title)).toEqual(["Size", "Color"]);
    expect(product.options[0]?.values.map((value) => value.value)).toEqual(["M", "L"]);
    expect(product.images).toEqual([
      { src: "https://cdn.example/1.jpg", alt: "Свитер спереди" },
      { src: "https://cdn.example/2.jpg", alt: "Свитер из альпаки — фото 2" },
    ]);
    expect(product.description).toEqual(["Мягкий свитер из альпаки.", "Вязка косами."]);
    expect(product.categories).toEqual([
      { name: "Одежда", href: "/catalog/clothing" },
      { name: "Свитеры", href: "/catalog/sweaters" },
    ]);
    expect(product.subtitle).toBeUndefined();
    expect(product.dimensions).toBeUndefined();
    expect(product.originCountry).toBe("it");
  });

  it("варианты: опции по названию, наличие, скидка только если старая цена выше", () => {
    const [beige, blackM, blackL] = product.variants;
    expect(beige?.options).toEqual({ Color: "Beige", Size: "M" });
    expect(beige?.price).toEqual({ amount: 24_800, originalAmount: undefined, currencyCode: "rub" });
    expect(blackM?.inStock).toBe(false);
    expect(blackL?.price?.originalAmount).toBe(24_800);
  });

  it("без учёта остатков или с предзаказом вариант в наличии", () => {
    const [noTracking, backorder] = fromStoreProductDetail({
      ...storeProduct,
      variants: [variant("a", "Beige", "M", { manageInventory: false, inventoryQuantity: 0 }), variant("b", "Beige", "L", { allowBackorder: true, inventoryQuantity: 0 })],
    } as unknown as StoreProduct).variants;
    expect(noTracking?.inStock).toBe(true);
    expect(backorder?.inStock).toBe(true);
  });

  it("нет фото — обложка", () => {
    expect(fromStoreProductDetail({ ...storeProduct, images: [] }).images).toEqual([
      { src: "https://cdn.example/thumb.jpg", alt: "Свитер из альпаки" },
    ]);
  });
});

describe("Товар: выбор варианта", () => {
  it("вариант определён, только когда выбраны все опции", () => {
    expect(findVariant(product, { Color: "Beige" })).toBeUndefined();
    expect(findVariant(product, { Color: "Beige", Size: "M" })?.id).toBe("1");
    expect(firstMissingOption(product, { Color: "Beige" })).toBe("Size");
  });

  it("состояние значения: в наличии, закончился, нет сочетания", () => {
    expect(optionValueState(product, { Color: "Black" }, "Size", "M")).toBe("soldout");
    expect(optionValueState(product, { Color: "Black" }, "Size", "L")).toBe("available");
    expect(optionValueState(product, { Color: "Beige" }, "Size", "L")).toBe("unavailable");
    // Выбранное значение самой опции не мешает: можно переключиться на другой цвет
    expect(optionValueState(product, { Color: "Beige", Size: "M" }, "Color", "Black")).toBe("soldout");
  });

  it("новое значение сбрасывает несовместимые", () => {
    expect(selectOptionValue(product, { Color: "Black", Size: "L" }, "Color", "Beige")).toEqual({ Color: "Beige" });
    expect(selectOptionValue(product, { Color: "Black", Size: "M" }, "Color", "Beige")).toEqual({ Size: "M", Color: "Beige" });
  });

  it("начальный выбор: вариант из ссылки, иначе первое доступное значение из preselect", () => {
    expect(initialSelection(product, { variantId: "3" })).toEqual({ Color: "Black", Size: "L" });
    expect(initialSelection(product, { variantId: "unknown", preselect: ["Color"] })).toEqual({ Color: "Beige" });
    expect(initialSelection(product)).toEqual({});
  });

  it("опция с одним значением выбрана сразу", () => {
    const single: ProductDetail = { ...product, options: [{ id: "o", title: "Size", values: [{ value: "One" }] }] };
    expect(initialSelection(single)).toEqual({ Size: "One" });
  });

  it("цена: «от» при разных ценах, точная у выбранного варианта", () => {
    expect(selectionPrice(product, {})).toMatchObject({ price: { amount: 19_840 }, from: true });
    expect(selectionPrice(product, { Color: "Beige" })).toMatchObject({ price: { amount: 24_800 }, from: false });
    expect(selectionPrice(product, { Color: "Black", Size: "L" })).toMatchObject({ price: { amount: 19_840, originalAmount: 24_800 } });
  });

  it("фото: выбранного цвета, если у варианта свои; без выбора — товара", () => {
    expect(selectionImages(product, { Color: "Beige" })[0]?.src).toBe("https://cdn.example/beige.jpg");
    expect(selectionImages(product, { Color: "Black" })).toBe(product.images);
    expect(selectionImages(product, {})).toBe(product.images);
  });
});

describe("Товар: группы выбора", () => {
  it("порядок и вид из конфига, подписи и цвета значений", () => {
    const groups = toPickerGroups(product, { Color: "Beige" }, options);
    expect(groups.map((group) => [group.option, group.type])).toEqual([
      ["Color", "color"],
      ["Size", "button"],
    ]);
    expect(groups[0]).toMatchObject({ label: "Цвет", selectedLabel: "Бежевый" });
    expect(groups[0]?.values.map((value) => value.swatch)).toEqual(["#cfac94", undefined]);
    expect(groups[1]?.values.map((value) => value.state)).toEqual(["available", "unavailable"]);
  });

  it("опция без записи с одним значением скрыта, с несколькими — кнопками в конце", () => {
    const withExtra: ProductDetail = {
      ...product,
      options: [
        { id: "d", title: "Default option", values: [{ value: "Default option value" }] },
        { id: "f", title: "Fit", values: [{ value: "Slim" }, { value: "Regular", metadata: { swatch: "#000" } }] },
        ...product.options,
      ],
    };
    expect(toPickerGroups(withExtra, {}, options).map((group) => group.option)).toEqual(["Color", "Size", "Fit"]);
  });

  it("цвет кружка — из metadata.swatch значения, если в конфиге нет", () => {
    const fromMetadata: ProductDetail = {
      ...product,
      options: [{ id: "c", title: "Color", values: [{ value: "Mint", metadata: { swatch: "#9fe2bf" } }] }],
    };
    expect(toPickerGroups(fromMetadata, {}, options)[0]?.values[0]?.swatch).toBe("#9fe2bf");
  });

  it("разметка: выбранное значение нажато, несуществующее недоступно, закончившееся подписано", () => {
    const html = renderToStaticMarkup(
      <VariantPickerView groups={toPickerGroups(product, { Color: "Black", Size: "L" }, options)} onSelect={() => {}} soldOutLabel="нет в наличии" />,
    );
    expect(html).toContain("Цвет");
    expect(html).toContain(": Чёрный");
    expect(html).toMatch(/aria-label="Бежевый"/);
    expect(html).toContain("M — нет в наличии");
    expect(html).toMatch(/aria-checked="true"[^>]*>L</);
  });
});

describe("Товар: блоки о товаре", () => {
  const sections: ProductSection[] = [
    { id: "fit", title: "Посадка", type: "metadata", key: "fit" },
    { id: "empty", title: "Пусто", type: "metadata", key: "missing" },
    {
      id: "care",
      title: "Состав и уход",
      type: "attributes",
      items: [
        { label: "Состав", source: { metadata: "composition" } },
        { label: "Страна", source: "originCountry" },
        { label: "Вес", source: "weight" },
        { label: "Артикул", source: "sku" },
        { label: "Коллекция", source: "collection" },
      ],
    },
  ];
  const context = { units: { weight: "г", length: "см" }, locale: "ru" };

  it("пустые блоки и строки без данных скрыты", () => {
    const result = toDetailSections(product, sections, context);
    expect(result.map((section) => section.id)).toEqual(["fit", "care"]);
    expect(result[0]?.paragraphs).toEqual(["Свободный крой.", "Модель на фото носит S."]);
    expect(result[1]?.attributes).toEqual([
      { label: "Состав", value: "60% альпака, 40% шерсть" },
      { label: "Страна", value: "Италия" },
      { label: "Вес", value: "450 г" },
    ]);
  });

  it("текст закрытых блоков — в HTML страницы, заголовки — h3", () => {
    const html = renderToStaticMarkup(<ProductDetailsView sections={toDetailSections(product, sections, context)} />);
    expect(html).toContain("Модель на фото носит S.");
    expect(html).toContain("<dt>Страна</dt>");
    expect(html).toMatch(/<h3[^>]*>.*Посадка/);
  });
});

describe("Товар: разметка для поисковиков", () => {
  const siteUrl = "https://shop.example";
  /** Разметка как её прочитает поисковик: JSON без типов */
  const plain = (data: object) => JSON.parse(JSON.stringify(data));

  it("несколько вариантов — ProductGroup с ценой, наличием и ссылкой каждого", () => {
    const data = plain(productJsonLd(product, { siteUrl, brand: "Magazine", options, description: "Описание" }));
    expect(data["@type"]).toBe("ProductGroup");
    expect(data.url).toBe("https://shop.example/products/alpaca-sweater");
    expect(data.variesBy).toEqual(["https://schema.org/size", "https://schema.org/color"]);
    expect(data.category).toBe("Одежда > Свитеры");
    const [beige, blackM] = data.hasVariant;
    expect(beige).toMatchObject({
      name: "Свитер из альпаки — M, Бежевый",
      color: "Бежевый",
      size: "M",
      image: ["https://cdn.example/beige.jpg"],
      offers: {
        price: 24_800,
        priceCurrency: "RUB",
        availability: "https://schema.org/InStock",
        url: "https://shop.example/products/alpaca-sweater?variant=1",
      },
    });
    expect(blackM.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("один вариант — Product с Offer, бренд из metadata.brand", () => {
    const single: ProductDetail = { ...product, variants: product.variants.slice(0, 1), metadata: { brand: "Alpaca Co" } };
    const data = plain(productJsonLd(single, { siteUrl, brand: "Magazine", options }));
    expect(data["@type"]).toBe("Product");
    expect(data).toMatchObject({ sku: "SW-1", brand: { name: "Alpaca Co" }, offers: { price: 24_800 } });
  });

  it("meta description — по границе слова, SEO-поля из metadata важнее", () => {
    expect(toMetaDescription("Короткий текст")).toBe("Короткий текст");
    const long = toMetaDescription("слово ".repeat(60));
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("слово…")).toBe(true);
    expect(productSeo(product)).toEqual({ title: "Свитер из альпаки", description: "Мягкий свитер из альпаки. Вязка косами." });
    expect(productSeo({ ...product, metadata: { seo_title: "Купить свитер" } }).title).toBe("Купить свитер");
    expect(minPrice(product)?.amount).toBe(19_840);
  });

  it("?variant= из адреса: первое значение, мусор не роняет", () => {
    expect(productParamsSchema.parse({ variant: ["a", "b"] })).toEqual({ variant: "a" });
    expect(productParamsSchema.parse({ variant: 1 })).toEqual({ variant: undefined });
    expect(productParamsSchema.parse({})).toEqual({ variant: undefined });
  });
});

describe("Товар: раскладка", () => {
  it("h1, цена со старой ценой и регионы на своих местах", () => {
    const html = renderToStaticMarkup(
      <ProductOverviewView
        gallery={<div>gallery</div>}
        title="Свитер из альпаки"
        price={<ProductPrice price="19 840 ₽" originalPrice="24 800 ₽" discount="−20%" />}
        summary={["Мягкий свитер."]}
        buy={<button type="button">Добавить в корзину</button>}
      />,
    );
    expect(html).toContain('<h1 class="text-600">Свитер из альпаки</h1>');
    expect(html).toMatch(/<s[^>]*><span class="sr-only">Цена без скидки: <\/span>24 800 ₽<\/s>/);
  });

  it("конфиг шаблона: у опций с preselect есть значения в каталоге цветов", () => {
    const color = siteConfig.product.options.find((option) => option.type === "color");
    expect(color?.swatches?.Beige).toBeDefined();
    expect(siteConfig.catalog.filter?.items.find((item) => item.type === "color")).toMatchObject({ swatches: color?.swatches });
  });
});

describe("Товар: особенности и лукбук из metadata", () => {
  const highlights = [
    { label: "Дизайн", title: "Тёплый и лёгкий", text: "Крупная вязка косами." },
    { title: "Сделано в Италии", text: "" },
  ];
  const lookbook = { title: "Элегантная простота", subtitle: "Базовый гардероб", images: [{ url: "https://cdn.example/l1.jpg" }, { src: "https://cdn.example/l2.jpg", alt: "Стопка свитеров" }, { alt: "без фото" }] };

  it("JSON-объект и JSON-строка из админки читаются одинаково", () => {
    expect(productHighlights({ ...product, metadata: { highlights } }, "highlights")).toEqual(highlights);
    expect(productHighlights({ ...product, metadata: { highlights: JSON.stringify(highlights) } }, "highlights")).toHaveLength(2);
  });

  it("неверный формат или нет данных — блока нет, страница не падает", () => {
    expect(productHighlights({ ...product, metadata: { highlights: "{не json" } }, "highlights")).toEqual([]);
    expect(productHighlights({ ...product, metadata: { highlights: [{ text: "без заголовка" }] } }, "highlights")).toEqual([]);
    expect(productLookbook(product, "lookbook")).toBeUndefined();
    expect(productLookbook({ ...product, metadata: { lookbook: { images: [] } } }, "lookbook")).toBeUndefined();
  });

  it("лукбук: src или url, alt по умолчанию из заголовка, фото без адреса пропущены", () => {
    expect(productLookbook({ ...product, metadata: { lookbook: JSON.stringify(lookbook) } }, "lookbook")).toEqual({
      title: "Элегантная простота",
      subtitle: "Базовый гардероб",
      images: [
        { src: "https://cdn.example/l1.jpg", alt: "Элегантная простота — фото 1" },
        { src: "https://cdn.example/l2.jpg", alt: "Стопка свитеров" },
      ],
    });
  });

  it("разметка: h2 секции для поисковиков, h3 у колонок; пустой блок не выводится", () => {
    const html = renderToStaticMarkup(<HighlightsView title="Особенности" items={highlights} />);
    expect(html).toMatch(/<h2[^>]*class="sr-only"[^>]*>Особенности<\/h2>/);
    expect(html).toContain('<h3 class="text-400">Тёплый и лёгкий</h3>');
    expect(html).toContain("Дизайн");
    expect(renderToStaticMarkup(<HighlightsView title="Особенности" items={[]} />)).toBe("");
  });

  it("«Носите с»: handle массивом, JSON-строкой или через запятую; мусор — пусто", () => {
    const handles = ["ponte-pant", "hoop-earrings"];
    expect(productRelatedHandles({ metadata: { style_with: handles } }, "style_with")).toEqual(handles);
    expect(productRelatedHandles({ metadata: { style_with: JSON.stringify(handles) } }, "style_with")).toEqual(handles);
    expect(productRelatedHandles({ metadata: { style_with: " ponte-pant, hoop-earrings,,ponte-pant" } }, "style_with")).toEqual(handles);
    expect(productRelatedHandles({ metadata: { style_with: 42 } }, "style_with")).toEqual([]);
    expect(productRelatedHandles({ metadata: {} }, "style_with")).toEqual([]);
  });

  it("лукбук: видимый заголовок или скрытый h2, фото с alt", () => {
    const visible = renderToStaticMarkup(<LookbookView title="Элегантная простота" subtitle="Базовый гардероб" images={[{ src: "https://cdn.example/l1.jpg", alt: "Образ" }]} />);
    expect(visible).toContain(">Элегантная простота</h2>");
    expect(visible).toContain('alt="Образ"');
    const hidden = renderToStaticMarkup(<LookbookView hiddenTitle="Свитер" images={[{ src: "https://cdn.example/l1.jpg", alt: "Образ" }]} />);
    expect(hidden).toMatch(/class="[^"]*sr-only[^"]*"><h2[^>]*>Свитер<\/h2>/);
  });
});

describe("Товар: отзывы", () => {
  const config = siteConfig.product.reviews!;

  it("страница отзывов: новые сверху, сводка по всем", async () => {
    const first = await listProductReviews({ productId: "p", limit: 5 });
    const third = await listProductReviews({ productId: "p", limit: 5, offset: 10 });
    expect(first.items).toHaveLength(5);
    expect(third.items).toHaveLength(4);
    expect(first.summary).toEqual(third.summary);
    expect(first.items[0]!.createdAt >= first.items[1]!.createdAt).toBe(true);
  });

  it("адреса пагинации: первая без параметра, с якорем к отзывам; мусор — первая страница", () => {
    expect(reviewsHref("/products/sweater", "reviews", 1)).toBe("/products/sweater#reviews");
    expect(reviewsHref("/products/sweater", "reviews", 3)).toBe("/products/sweater?reviews=3#reviews");
    expect(pageNumberSchema.parse(["2", "5"])).toBe(2);
    expect(pageNumberSchema.parse("abc")).toBe(1);
  });

  it("разметка: средняя оценка со склонением, проверенный покупатель, дата в <time>", async () => {
    const reviews = await listProductReviews({ productId: "p", limit: 5 });
    const html = renderToStaticMarkup(
      <ProductReviews reviews={reviews} page={1} totalPages={3} href={(page) => `/p?reviews=${page}`} config={config} />,
    );
    expect(html).toContain(`На основе ${reviews.summary.count} отзывов`);
    expect(html).toContain("Проверенный покупатель");
    expect(html).toContain('<time dateTime="2024-01-12"');
    expect(html).toContain("12.01.24");
    expect(html).toContain('id="reviews"');
    expect(html).toContain('href="/p?reviews=2"');
  });

  it("звёзды: подпись для скринридера, дробная оценка закрашивает часть звезды", () => {
    const html = renderToStaticMarkup(<RatingStars value={4.4} />);
    expect(html).toContain('aria-label="Оценка 4,4 из 5"');
    expect(html).toContain("calc(4 * (var(--star) + var(--star-gap))");
  });

  it("JSON-LD: aggregateRating и отзывы; без отзывов — ничего", async () => {
    const reviews = await listProductReviews({ productId: "p", limit: 2 });
    const data = reviewsJsonLd(reviews.summary, reviews.items);
    expect(data.aggregateRating).toMatchObject({ ratingValue: reviews.summary.average, reviewCount: 14, bestRating: 5 });
    expect(data.review?.[0]).toMatchObject({ "@type": "Review", author: { name: "Алина А." }, reviewRating: { ratingValue: 5 } });
    expect(reviewsJsonLd({ average: 0, count: 0 }, [])).toEqual({});
  });
});
