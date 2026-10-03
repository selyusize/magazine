import type { StoreProduct, StoreProductVariant } from "@shared/api";
import { routes } from "@shared/config";

import type { ProductCategoryLink, ProductDetail, ProductImage, ProductOption, ProductVariant } from "./types";

type StoreCategory = { name?: string; handle?: string; parentCategory?: StoreCategory | null };
type StoreImage = { url?: string; rank?: number; metadata?: Record<string, unknown> | null };

const byRank = <T extends { rank?: number }>(a: T, b: T) => (a.rank ?? 0) - (b.rank ?? 0);

/** Пустые строки и null из Medusa → undefined: поле просто не выводится */
const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
const positive = (value: unknown) => (typeof value === "number" && value > 0 ? value : undefined);

/** Абзацы: разделены пустой строкой. Одиночный перенос внутри абзаца — пробел */
export function toParagraphs(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

/**
 * Alt фото: подпись из metadata.alt в админке, иначе название товара с номером —
 * у поисковика по картинкам будет осмысленный текст, а не пустой alt
 */
function toImages(images: StoreImage[] | undefined, title: string): ProductImage[] {
  return [...(images ?? [])]
    .sort(byRank)
    .flatMap((image, index) =>
      image.url ? [{ src: image.url, alt: text(image.metadata?.alt) ?? (index ? `${title} — фото ${index + 1}` : title) }] : [],
    );
}

/** Категория товара и её родители: [«Одежда», «Свитеры»] */
function toCategoryChain(category: StoreCategory | undefined): ProductCategoryLink[] {
  const chain: ProductCategoryLink[] = [];
  for (let node = category; node?.name && node.handle; node = node.parentCategory ?? undefined) {
    chain.unshift({ name: node.name, href: routes.category(node.handle) });
  }
  return chain;
}

function toVariant(variant: StoreProductVariant, optionTitles: Map<string, string>, title: string): ProductVariant {
  const price = variant.calculatedPrice;
  const amount = price?.calculatedAmount;
  // Без учёта остатков и с предзаказом вариант доступен всегда; inventory_quantity есть, только если его запросили
  const inStock = !variant.manageInventory || variant.allowBackorder || (variant.inventoryQuantity ?? 0) > 0;

  return {
    id: variant.id,
    title: variant.title,
    sku: text(variant.sku),
    gtin: text(variant.ean) ?? text(variant.upc) ?? text(variant.barcode),
    options: Object.fromEntries(
      (variant.options ?? []).flatMap((value) => {
        const option = value.optionId && optionTitles.get(value.optionId);
        return option ? [[option, value.value]] : [];
      }),
    ),
    price:
      typeof amount === "number" && price?.currencyCode
        ? {
            amount,
            originalAmount: typeof price.originalAmount === "number" && price.originalAmount > amount ? price.originalAmount : undefined,
            currencyCode: price.currencyCode,
          }
        : undefined,
    inStock,
    images: toImages(variant.images as StoreImage[] | undefined, title),
  };
}

/** Товар Medusa → данные страницы товара. Единственное место, которое знает форму ответа /store/products для неё. */
export function fromStoreProductDetail(product: StoreProduct): ProductDetail {
  const options: ProductOption[] = (product.options ?? []).map((option) => ({
    id: option.id,
    title: option.title,
    values: [...(option.values ?? [])].sort(byRank).map(({ value, metadata }) => ({ value, metadata: metadata ?? undefined })),
  }));
  const optionTitles = new Map(options.map((option) => [option.id, option.title]));
  const images = toImages(product.images as StoreImage[], product.title);
  const thumbnail = text(product.thumbnail);
  const [length, width, height] = [positive(product.length), positive(product.width), positive(product.height)];
  const collection = product.collection;

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    subtitle: text(product.subtitle),
    description: toParagraphs(text(product.description)),
    href: routes.product(product.handle),
    // Фото нет, но есть обложка — показываем её
    images: images.length || !thumbnail ? images : [{ src: thumbnail, alt: product.title }],
    options,
    variants: [...(product.variants ?? [])]
      .sort((a, b) => (a.variantRank ?? 0) - (b.variantRank ?? 0))
      .map((variant) => toVariant(variant, optionTitles, product.title)),
    categories: toCategoryChain(product.categories?.[0] as StoreCategory | undefined),
    categoryIds: (product.categories ?? []).flatMap((category) => text((category as { id?: unknown }).id) ?? []),
    collection: collection?.title && collection.handle ? { name: collection.title, href: routes.collection(collection.handle) } : undefined,
    type: text(product.type?.value),
    material: text(product.material),
    originCountry: text(product.originCountry)?.toLowerCase(),
    weight: positive(product.weight),
    dimensions: length && width && height ? [length, width, height] : undefined,
    metadata: (product.metadata as Record<string, unknown> | undefined) ?? {},
  };
}
