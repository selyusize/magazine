import type { ProductOptionConfig } from "@shared/config";
import { routes } from "@shared/config";
import { absolute } from "@shared/lib/structured-data";

import type { ProductDetail, ProductImage, ProductVariant } from "./types";

type ProductJsonLdOptions = {
  siteUrl: string;
  /** Бренд: metadata.brand товара важнее */
  brand: string;
  /** Подписи значений и свойства schema.org опций (siteConfig.product.options) */
  options: ProductOptionConfig[];
  /** Описание для разметки: обычно то же, что meta description */
  description?: string;
};

const SCHEMA = "https://schema.org";

/** Цена в разметке — числом с точкой, валюта — ISO 4217 заглавными */
function offer(variant: ProductVariant, url: string) {
  if (!variant.price) return undefined;
  return {
    "@type": "Offer",
    url,
    price: variant.price.amount,
    priceCurrency: variant.price.currencyCode.toUpperCase(),
    availability: `${SCHEMA}/${variant.inStock ? "InStock" : "OutOfStock"}`,
    itemCondition: `${SCHEMA}/NewCondition`,
  };
}

const imageUrls = (images: ProductImage[], siteUrl: string) => images.map((image) => absolute(image.src, siteUrl));

/**
 * Разметка товара для расширенного сниппета Яндекса и Google: фото, цена, наличие.
 * Один вариант — Product с Offer. Несколько — ProductGroup: у каждого варианта своя цена, наличие и ссылка
 * (`?variant=`), variesBy — свойства, которыми они различаются (цвет, размер).
 */
export function productJsonLd(product: ProductDetail, { siteUrl, brand, options, description }: ProductJsonLdOptions) {
  const url = absolute(product.href, siteUrl);
  const configs = new Map(options.map((option) => [option.option, option]));
  const label = (option: string, value: string) => configs.get(option)?.labels?.[value] ?? value;
  const base = {
    name: product.title,
    ...(description && { description }),
    brand: { "@type": "Brand", name: typeof product.metadata.brand === "string" ? product.metadata.brand : brand },
    ...(product.categories.length && { category: product.categories.map((category) => category.name).join(" > ") }),
    ...(product.material && { material: product.material }),
  };

  const [single] = product.variants;
  if (product.variants.length <= 1) {
    return {
      "@context": SCHEMA,
      "@type": "Product",
      ...base,
      url,
      image: imageUrls(product.images, siteUrl),
      ...(single?.sku && { sku: single.sku }),
      ...(single?.gtin && { gtin: single.gtin }),
      ...(single && { offers: offer(single, url) }),
    };
  }

  // Опции, у которых задано свойство schema.org: color, size…
  const properties = product.options.flatMap((option) => {
    const property = configs.get(option.title)?.schemaProperty;
    return property ? [{ option: option.title, property }] : [];
  });

  return {
    "@context": SCHEMA,
    "@type": "ProductGroup",
    ...base,
    url,
    productGroupID: product.handle,
    image: imageUrls(product.images, siteUrl),
    ...(properties.length && { variesBy: properties.map(({ property }) => `${SCHEMA}/${property}`) }),
    hasVariant: product.variants.map((variant) => {
      const values = product.options.flatMap((option) => {
        const value = variant.options[option.title];
        return value ? [label(option.title, value)] : [];
      });
      return {
        "@type": "Product",
        name: values.length ? `${product.title} — ${values.join(", ")}` : product.title,
        ...(variant.sku && { sku: variant.sku }),
        ...(variant.gtin && { gtin: variant.gtin }),
        image: imageUrls(variant.images.length ? variant.images : product.images.slice(0, 1), siteUrl),
        ...Object.fromEntries(
          properties.flatMap(({ option, property }) => {
            const value = variant.options[option];
            return value ? [[property, label(option, value)]] : [];
          }),
        ),
        offers: offer(variant, absolute(routes.product(product.handle, variant.id), siteUrl)),
      };
    }),
  };
}
