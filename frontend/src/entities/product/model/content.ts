import { z } from "@shared/lib/zod";

import type { ProductDetail, ProductImage } from "./types";

/**
 * Контент товара для блоков под первым экраном — из metadata товара в Medusa.
 * Значение — JSON-объект/массив (через API) или та же JSON-строка (поле metadata в админке хранит строки).
 * Неверный формат не роняет страницу: блок просто не выводится.
 */

/** Особенность товара: «ДИЗАЙН / Тёплый и лёгкий / текст» */
export type ProductHighlight = { label?: string; title: string; text: string };

/** Лукбук: заголовок, подзаголовок и фото товара в образах */
export type ProductLookbook = { title?: string; subtitle?: string; images: ProductImage[] };

/** JSON-строка → значение; не JSON — как есть (zod отклонит) */
const parseJson = (value: unknown) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const text = z.string().trim();

const highlightsSchema = z.array(
  z.object({ label: text.optional(), title: text.min(1), text: text.default("") }),
);

const lookbookSchema = z.object({
  title: text.optional(),
  subtitle: text.optional(),
  // src или url — как удобнее заполнять; alt по умолчанию — название товара
  images: z.array(z.object({ src: text.optional(), url: text.optional(), alt: text.optional() })),
});

/**
 * Особенности товара из `metadata[key]`:
 * `[{ "label": "Дизайн", "title": "Тёплый и лёгкий", "text": "…" }]`
 */
export function productHighlights(product: ProductDetail, key: string): ProductHighlight[] {
  const result = highlightsSchema.safeParse(parseJson(product.metadata[key]));
  return result.success ? result.data : [];
}

/**
 * Лукбук из `metadata[key]`: `{ "title": "…", "subtitle": "…", "images": [{ "src": "https://…", "alt": "…" }] }`.
 * Без фото — undefined
 */
export function productLookbook(product: ProductDetail, key: string): ProductLookbook | undefined {
  const result = lookbookSchema.safeParse(parseJson(product.metadata[key]));
  if (!result.success) return undefined;
  const { title, subtitle } = result.data;
  const images = result.data.images.flatMap((image, index) => {
    const src = image.src || image.url;
    return src ? [{ src, alt: image.alt || `${title ?? product.title} — фото ${index + 1}` }] : [];
  });
  return images.length ? { title: title || undefined, subtitle: subtitle || undefined, images } : undefined;
}

const handlesSchema = z.union([
  z.array(text),
  // Строка через запятую — так проще заполнить поле metadata в админке
  text.transform((value) => value.split(",").map((handle) => handle.trim())),
]);

/** Handle товаров из `metadata[key]`: `["ponte-pant", "hoop-earrings"]` или `"ponte-pant, hoop-earrings"` */
export function productRelatedHandles(product: Pick<ProductDetail, "metadata">, key: string): string[] {
  const result = handlesSchema.safeParse(parseJson(product.metadata[key]));
  return result.success ? [...new Set(result.data.filter(Boolean))] : [];
}
