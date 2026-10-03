import { createHash } from "node:crypto";

import { z } from "@medusajs/framework/zod";

import { isRecord } from "@shared/query/narrow";

import type { CMLProduct } from "./commerceml/types";

/** Свойство поставщика с маппингом — из таблицы `exchange_property`. */
export type PropertyMapping = {
  name: string;
  values: Record<string, string>;
  attribute_id: string | null;
};

/**
 * Товар поставщика, приведённый к понятиям магазина: значения справочников раскрыты, свойства разложены на
 * характеристики магазина и «прочие» (в metadata), бренд найден. Хранится в `exchange_product.data`, по его хэшу
 * повторная выгрузка без изменений пропускается. Схема — для чтения из JSON-поля без приведений типов.
 */
export const ImportedProductSchema = z.object({
  external_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  group_ids: z.array(z.string()),
  /** Категория магазина по маппингу групп: часть данных, поэтому смена маппинга меняет хэш и применяется импортом. */
  category_id: z.string().nullable(),
  images: z.array(z.string()),
  brand: z.string().nullable(),
  attributes: z.array(z.object({ attribute_id: z.string(), value: z.string() })),
  /** Свойства без характеристики магазина: не теряются, ложатся в `metadata.supplier_properties`. */
  properties: z.record(z.string(), z.string()),
  /** Вес, г (1С отдаёт килограммы в реквизите «Вес»). */
  weight: z.number().nullable(),
  deleted: z.boolean(),
});

export type ImportedProduct = z.infer<typeof ImportedProductSchema>;

/** Где поставщики держат бренд — свойство или реквизит с одним из этих названий. */
const BRAND_NAMES = ["бренд", "торговая марка", "марка", "brand", "производитель"];

/** Ключ сравнения названий (свойств, брендов): регистр, «ё» и лишние пробелы не важны. */
export const nameKey = (name: string) => name.trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");

/**
 * CMLProduct → ImportedProduct. `properties` — свойства поставщика по Ид, `groups` — группы с маппингом на
 * категории, `brand_property` — название свойства с брендом из настроек поставщика (если оно нестандартное).
 */
export function toImportedProduct(
  product: CMLProduct,
  context: {
    properties: Map<string, PropertyMapping>;
    groups: Map<string, GroupMapping>;
    brand_property: string | null;
  },
): ImportedProduct {
  const brandNames = new Set([...(context.brand_property ? [nameKey(context.brand_property)] : []), ...BRAND_NAMES]);
  const attributes: ImportedProduct["attributes"] = [];
  const properties: Record<string, string[]> = {};
  const brands: { rank: number; value: string }[] = [];
  const rank = (name: string) => [...brandNames].indexOf(nameKey(name));

  for (const { property_id, value: raw } of product.properties) {
    const property = context.properties.get(property_id);
    const value = (property?.values[raw] ?? raw).trim();
    if (!value) continue;
    const name = property?.name ?? property_id;

    if (rank(name) >= 0) brands.push({ rank: rank(name), value });
    else if (property?.attribute_id) attributes.push({ attribute_id: property.attribute_id, value });
    else properties[name] = [...(properties[name] ?? []), value];
  }
  for (const requisite of product.requisites)
    if (rank(requisite.name) >= 0) brands.push({ rank: rank(requisite.name) + brandNames.size, value: requisite.value });

  const brand = brands.sort((a, b) => a.rank - b.rank)[0]?.value ?? product.manufacturer;
  const weight = Number(
    (product.requisites.find((requisite) => nameKey(requisite.name) === "вес")?.value ?? "").replace(",", "."),
  );

  return {
    external_id: product.external_id,
    title: product.name.replace(/\s+/g, " ").trim(),
    description: product.description,
    sku: product.sku,
    barcode: product.barcode,
    group_ids: product.group_ids,
    category_id: resolveCategoryId(product.group_ids, context.groups),
    images: [...new Set(product.images)],
    brand: brand?.trim() || null,
    attributes,
    properties: Object.fromEntries(Object.entries(properties).map(([name, values]) => [name, values.join(", ")])),
    weight: weight > 0 ? Math.round(weight * 1000) : null,
    deleted: product.deleted,
  };
}

/** Хэш содержимого: ключи отсортированы, поэтому порядок полей и свойств в файле не важен. */
export function contentHash(product: ImportedProduct): string {
  return createHash("sha1").update(stableJSON(product)).digest("hex");
}

function stableJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJSON).join(",")}]`;
  if (isRecord(value))
    return `{${Object.keys(value)
      .sort()
      .map((name) => `${JSON.stringify(name)}:${stableJSON(value[name])}`)
      .join(",")}}`;
  return JSON.stringify(value ?? null);
}

/** Группа поставщика для поиска категории: родитель и сопоставленная категория магазина. */
export type GroupMapping = { parent_external_id: string | null; category_id: string | null };

/**
 * Категория магазина товара: первая сопоставленная группа товара, а если группа не сопоставлена — ближайший
 * сопоставленный предок («Кеды» не сопоставлены, «Обувь» → «Обувь» магазина). Ничего — `null`.
 */
export function resolveCategoryId(groupIds: string[], groups: Map<string, GroupMapping>): string | null {
  for (const groupId of groupIds) {
    const seen = new Set<string>();
    let current: string | null = groupId;
    while (current && !seen.has(current)) {
      seen.add(current);
      const group = groups.get(current);
      if (!group) break;
      if (group.category_id) return group.category_id;
      current = group.parent_external_id;
    }
  }
  return null;
}
