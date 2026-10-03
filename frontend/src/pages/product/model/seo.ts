import type { ProductDetail } from "@entities/product";

/** Meta description: до max символов по границе слова, с многоточием. Поисковики обрезают длинные сами — но хуже */
export function toMetaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max / 2 ? cut.lastIndexOf(" ") : cut.length).replace(/[\s,.;:—–-]+$/, "")}…`;
}

const metaText = (product: ProductDetail, key: string) => {
  const value = product.metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

/**
 * Заголовок и описание для поисковиков. Можно задать вручную в админке Medusa (metadata `seo_title`,
 * `seo_description`), иначе — название товара и начало описания (или подзаголовок)
 */
export function productSeo(product: ProductDetail) {
  return {
    title: metaText(product, "seo_title") ?? product.title,
    description: metaText(product, "seo_description") ?? toMetaDescription(product.description.join(" ") || product.subtitle || product.title),
  };
}

/** Минимальная цена среди вариантов — для тегов Open Graph product:price */
export function minPrice(product: ProductDetail) {
  return product.variants.reduce<ProductDetail["variants"][number]["price"]>(
    (min, variant) => (variant.price && (!min || variant.price.amount < min.amount) ? variant.price : min),
    undefined,
  );
}
