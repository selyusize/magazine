import { toParagraphs, type ProductDetail } from "@entities/product";
import type { NavLink, ProductAttributeSource, ProductPageConfig, ProductSection } from "@shared/config";

/** Блок аккордеона, готовый к выводу: абзацы, список «название — значение», ссылка */
export type DetailSection = {
  id: string;
  title: string;
  paragraphs: string[];
  attributes: { label: string; value: string }[];
  link?: NavLink;
};

type Context = { units: ProductPageConfig["units"]; locale: string };

const number = (value: number, locale: string) => new Intl.NumberFormat(locale).format(value);

/** Страна по ISO-коду на языке витрины: `it` → «Италия». Неизвестный код — как есть */
function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Значение характеристики товара. Нет данных — undefined, строка не выводится */
export function attributeValue(product: ProductDetail, source: ProductAttributeSource, { units, locale }: Context): string | undefined {
  if (typeof source === "object") {
    const value = product.metadata[source.metadata];
    return typeof value === "string" || typeof value === "number" ? String(value).trim() || undefined : undefined;
  }
  switch (source) {
    case "material":
      return product.material;
    case "originCountry":
      return product.originCountry && countryName(product.originCountry, locale);
    case "weight":
      return product.weight ? `${number(product.weight, locale)} ${units.weight}` : undefined;
    case "dimensions":
      return product.dimensions && `${product.dimensions.map((side) => number(side, locale)).join(" × ")} ${units.length}`;
    case "sku": {
      // Артикул товара — общий у всех вариантов. Разные артикулы у вариантов не выводятся: какой из них — зависит от выбора
      const skus = new Set(product.variants.map((variant) => variant.sku));
      const [sku] = skus;
      return skus.size === 1 ? sku : undefined;
    }
    case "type":
      return product.type;
    case "collection":
      return product.collection?.name;
  }
}

function toSection(product: ProductDetail, section: ProductSection, context: Context): DetailSection {
  const base = { id: section.id, title: section.title, paragraphs: [], attributes: [] };
  switch (section.type) {
    case "description":
      return { ...base, paragraphs: product.description };
    case "metadata": {
      const value = product.metadata[section.key];
      return { ...base, paragraphs: typeof value === "string" ? toParagraphs(value) : [] };
    }
    case "attributes":
      return {
        ...base,
        attributes: section.items.flatMap(({ label, source }) => {
          const value = attributeValue(product, source, context);
          return value ? [{ label, value }] : [];
        }),
      };
    case "text":
      return { ...base, paragraphs: section.content, link: section.link };
  }
}

/** Блоки из конфига → данные для вывода. Блок без содержимого скрыт: у товара нет этих данных */
export function toDetailSections(product: ProductDetail, sections: ProductSection[], context: Context): DetailSection[] {
  return sections
    .map((section) => toSection(product, section, context))
    .filter((section) => section.paragraphs.length || section.attributes.length);
}
