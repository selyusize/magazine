import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { isString, recordOf, recordOrNull, records, text, textOrNull } from "@shared/query/narrow";

import type { SetCatalogForProductsCommand } from "../command";

/** Что поменять: только отличающееся от текущего. */
export type CatalogForProductsPlan = {
  brands: { product_id: string; previous: string | null; next: string | null }[];
  categories: {
    product_id: string;
    row: { id: string; category_id: string } | null;
    next: string | null;
  }[];
};

/** Текущие бренд и основная категория товара из строки Query. */
const toCurrentCatalog = (value: unknown) => {
  const product = recordOf(value);
  const main = recordOrNull(product.product_main_category);
  const rowId = textOrNull(main?.id);
  const categoryId = textOrNull(main?.category_id);
  return {
    id: text(product.id),
    brand_id: textOrNull(recordOrNull(product.brand)?.id),
    main_category: rowId && categoryId ? { id: rowId, category_id: categoryId } : null,
  };
};

const idsOf = (rows: unknown[]) => new Set(records(rows).flatMap((row) => (isString(row.id) ? [row.id] : [])));

/**
 * Только чтение: текущие бренды и основные категории товаров → план изменений. Несуществующие товары, бренды и
 * категории пропускаются: пачку импорта не валит одна устаревшая ссылка из маппинга.
 */
export const planCatalogForProductsStep = createStep(
  "plan-catalog-for-products",
  async (command: SetCatalogForProductsCommand, { container }) => {
    const plan: CatalogForProductsPlan = { brands: [], categories: [] };
    if (!command.items.length) return new StepResponse(plan);

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const ids = (values: (string | null | undefined)[]) => [
      ...new Set(values.filter((value): value is string => Boolean(value))),
    ];
    const brandIds = ids(command.items.map((item) => item.brand_id));
    const categoryIds = ids(command.items.map((item) => item.main_category_id));

    const [{ data: products }, { data: brands }, { data: categories }] = await Promise.all([
      query.graph({
        entity: "product",
        fields: ["id", "brand.id", "product_main_category.id", "product_main_category.category_id"],
        filters: { id: command.items.map((item) => item.product_id) },
      }),
      brandIds.length
        ? query.graph({ entity: "brand", fields: ["id"], filters: { id: brandIds } })
        : { data: [] },
      categoryIds.length
        ? query.graph({ entity: "product_category", fields: ["id"], filters: { id: categoryIds } })
        : { data: [] },
    ]);
    const byId = new Map(products.map(toCurrentCatalog).map((product) => [product.id, product]));
    const knownBrands = idsOf(brands);
    const knownCategories = idsOf(categories);

    for (const item of command.items) {
      const product = byId.get(item.product_id);
      if (!product) continue;

      const previousBrand = product.brand_id;
      if (
        item.brand_id !== undefined &&
        item.brand_id !== previousBrand &&
        (item.brand_id === null || knownBrands.has(item.brand_id))
      )
        plan.brands.push({ product_id: product.id, previous: previousBrand, next: item.brand_id });

      const row = product.main_category;
      if (
        item.main_category_id !== undefined &&
        item.main_category_id !== (row?.category_id ?? null) &&
        (item.main_category_id === null || knownCategories.has(item.main_category_id))
      )
        plan.categories.push({
          product_id: product.id,
          row,
          next: item.main_category_id,
        });
    }
    return new StepResponse(plan);
  },
);
