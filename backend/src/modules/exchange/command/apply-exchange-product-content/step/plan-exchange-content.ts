import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { planContent, type ProductContent } from "../../../service/content-plan";
import type { EnsuredImages } from "../../../step/ensure-exchange-images";
import type { BrandByNameDTO } from "@domain/brand/command/ensure-brands-by-names/dto";

import type { LoadedExchangeContent } from "./load-exchange-content";

export type ExchangeContentPlan = {
  products: {
    id: string;
    title?: string;
    description?: string | null;
    images?: { url: string }[];
    thumbnail?: string | null;
    category_ids?: string[];
    weight?: number;
    metadata?: Record<string, unknown>;
  }[];
  catalog: { product_id: string; brand_id?: string | null; main_category_id?: string | null }[];
  attributes: { product_id: string; values: { attribute_id: string; value: string }[] }[];
  snapshots: { id: string; imported: Partial<ProductContent>; manual_fields: string[] }[];
};

/**
 * Без чтения и записи: что поменять в карточках (`planContent` — защита ручных правок), в каталоге, характеристиках
 * и снимках. Категории товара: категория импорта заменяет прежнюю категорию импорта, остальные (из админки)
 * остаются. Свойства без характеристики — в `metadata.supplier_properties`.
 */
export const planExchangeContentStep = createStep(
  "plan-exchange-content",
  async (input: { loaded: LoadedExchangeContent; images: EnsuredImages; brands: BrandByNameDTO[] }) => {
    const plan: ExchangeContentPlan = { products: [], catalog: [], attributes: [], snapshots: [] };
    const brandIds = new Map(input.brands.map((brand) => [brand.name, brand.brand_id]));

    for (const row of input.loaded.rows) {
      const current = input.loaded.products[row.product_id];
      if (!current) continue;
      const data = row.data;

      const next: ProductContent = {
        title: data.title,
        description: data.description,
        images: data.images.map((source) => input.images.urls[source]).filter((url): url is string => Boolean(url)),
        category_id: data.category_id,
        brand_id: data.brand ? (brandIds.get(data.brand.trim()) ?? null) : null,
      };
      const content = planContent({ next, current, imported: row.imported ?? {}, manual_fields: row.manual_fields ?? [] });
      const { changes } = content;

      const update: ExchangeContentPlan["products"][number] = { id: row.product_id };
      if (JSON.stringify(current.metadata.supplier_properties ?? {}) !== JSON.stringify(data.properties))
        update.metadata = { ...current.metadata, supplier_properties: data.properties };
      if (changes.title !== undefined) update.title = changes.title;
      if (changes.description !== undefined) update.description = changes.description;
      if (changes.images !== undefined) {
        update.images = changes.images.map((url) => ({ url }));
        update.thumbnail = changes.images[0] ?? null;
      }
      if (changes.category_id !== undefined) {
        const previous = row.imported?.category_id ?? current.category_id;
        update.category_ids = [
          ...new Set([
            ...current.category_ids.filter((id) => id !== previous),
            ...(changes.category_id ? [changes.category_id] : []),
          ]),
        ];
      }
      if (data.weight && data.weight !== current.weight) update.weight = data.weight;
      if (Object.keys(update).length > 1) plan.products.push(update);

      if (changes.category_id !== undefined || changes.brand_id !== undefined)
        plan.catalog.push({
          product_id: row.product_id,
          ...(changes.brand_id !== undefined ? { brand_id: changes.brand_id } : {}),
          ...(changes.category_id !== undefined ? { main_category_id: changes.category_id } : {}),
        });
      plan.attributes.push({ product_id: row.product_id, values: data.attributes });
      plan.snapshots.push({ id: row.id, imported: content.imported, manual_fields: content.manual_fields });
    }
    return new StepResponse(plan);
  },
);
