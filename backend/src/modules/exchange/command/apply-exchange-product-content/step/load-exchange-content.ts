import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import {
  isString,
  numberOr,
  numberOrNull,
  recordOf,
  recordOrNull,
  records,
  text,
  textOrNull,
} from "@shared/query/narrow";

import type { ContentField, ProductContent } from "../../../service/content-plan";
import { ContentFieldsSchema, ContentSnapshotSchema, parseOr } from "../../../service/exchange-json";
import { type ImportedProduct, ImportedProductSchema } from "../../../service/imported-product";
import type { ApplyExchangeProductContentCommand } from "../command";

export type ContentRow = {
  id: string;
  external_id: string;
  product_id: string;
  data: ImportedProduct;
  imported: Partial<ProductContent>;
  manual_fields: ContentField[];
};

export type CurrentProduct = ProductContent & {
  category_ids: string[];
  weight: number | null;
  metadata: Record<string, unknown>;
};

export type LoadedExchangeContent = {
  rows: ContentRow[];
  products: Record<string, CurrentProduct>;
};

/** Карточка из Query — как её видит план содержимого. */
function toCurrentProduct(value: unknown): CurrentProduct {
  const product = recordOf(value);
  return {
    title: text(product.title),
    description: textOrNull(product.description),
    images: records(product.images)
      .sort((a, b) => numberOr(a.rank) - numberOr(b.rank))
      .flatMap((image) => (isString(image.url) ? [image.url] : [])),
    category_id: textOrNull(recordOrNull(product.product_main_category)?.category_id),
    brand_id: textOrNull(recordOrNull(product.brand)?.id),
    category_ids: records(product.categories).flatMap((category) => (isString(category.id) ? [category.id] : [])),
    weight: numberOrNull(product.weight),
    metadata: recordOf(product.metadata),
  };
}

/** Только чтение: строки владельца с карточкой и карточки как сейчас. */
export const loadExchangeContentStep = createStep(
  "load-exchange-content",
  async (command: ApplyExchangeProductContentCommand, { container }) => {
    const empty: LoadedExchangeContent = { rows: [], products: {} };
    if (!command.external_ids.length) return new StepResponse(empty);

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: rows } = await query.graph({
      entity: "exchange_product",
      fields: ["id", "external_id", "product_id", "data", "imported", "manual_fields"],
      filters: {
        supplier_id: command.supplier_id,
        external_id: command.external_ids,
        is_owner: true,
        is_deleted: false,
      },
    });
    const owned: ContentRow[] = rows.flatMap((row) => {
      const data = ImportedProductSchema.safeParse(row.data);
      if (!row.product_id || !data.success) return [];
      return [
        {
          id: row.id,
          external_id: row.external_id,
          product_id: row.product_id,
          data: data.data,
          imported: parseOr(ContentSnapshotSchema, row.imported, {}),
          manual_fields: parseOr(ContentFieldsSchema, row.manual_fields, []),
        },
      ];
    });
    if (!owned.length) return new StepResponse(empty);

    const { data: products } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "description",
          "thumbnail",
          "images.url",
          "images.rank",
          "categories.id",
          "metadata",
          "weight",
          "brand.id",
          "product_main_category.category_id",
        ],
        filters: { id: owned.map((row) => row.product_id) },
    });

    return new StepResponse<LoadedExchangeContent>({
      rows: owned,
      products: Object.fromEntries(products.map((product) => [product.id, toCurrentProduct(product)])),
    });
  },
);
