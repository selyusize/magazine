import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { recordOf, recordOrNull, records, text, textOrNull } from "@shared/query/narrow";
import { categoryShopId, CATEGORY_SHOP_FIELDS, PRODUCT_SHOP_FIELDS, toProductShop } from "@shared/shop/catalog-shop";

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
    shop_id: toProductShop(product).shop_id,
    brand_id: textOrNull(recordOrNull(product.brand)?.id),
    main_category: rowId && categoryId ? { id: rowId, category_id: categoryId } : null,
  };
};

/** id → магазин строки: бренд — своё поле, категория — связь. */
const shopsOf = (rows: unknown[], shopOf: (row: Record<string, unknown>) => string | null) =>
  new Map(records(rows).map((row) => [text(row.id), shopOf(row)]));

/**
 * Только чтение: текущие бренды и основные категории товаров → план изменений. Несуществующие товары, бренды и
 * категории, а также бренды и категории чужого магазина пропускаются: пачку импорта не валит одна устаревшая
 * ссылка из маппинга, а в чужой магазин товар не уходит.
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
        fields: [
          "id",
          "brand.id",
          "product_main_category.id",
          "product_main_category.category_id",
          ...PRODUCT_SHOP_FIELDS,
        ],
        filters: { id: command.items.map((item) => item.product_id) },
      }),
      brandIds.length
        ? query.graph({ entity: "brand", fields: ["id", "shop_id"], filters: { id: brandIds } })
        : { data: [] },
      categoryIds.length
        ? query.graph({ entity: "product_category", fields: ["id", ...CATEGORY_SHOP_FIELDS], filters: { id: categoryIds } })
        : { data: [] },
    ]);
    const byId = new Map(products.map(toCurrentCatalog).map((product) => [product.id, product]));
    const brandShops = shopsOf(brands, (row) => textOrNull(row.shop_id));
    const categoryShops = shopsOf(categories, categoryShopId);

    for (const item of command.items) {
      const product = byId.get(item.product_id);
      if (!product) continue;

      const previousBrand = product.brand_id;
      if (
        item.brand_id !== undefined &&
        item.brand_id !== previousBrand &&
        (item.brand_id === null || (product.shop_id !== null && brandShops.get(item.brand_id) === product.shop_id))
      )
        plan.brands.push({ product_id: product.id, previous: previousBrand, next: item.brand_id });

      const row = product.main_category;
      if (
        item.main_category_id !== undefined &&
        item.main_category_id !== (row?.category_id ?? null) &&
        (item.main_category_id === null ||
          (product.shop_id !== null && categoryShops.get(item.main_category_id) === product.shop_id))
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
