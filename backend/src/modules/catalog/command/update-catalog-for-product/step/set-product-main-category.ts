import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { CATALOG_MODULE } from "../../../index";
import type { CatalogModuleService } from "../../../service/catalog-module-service";
import type { ProductCatalogChange } from "./validate-product-catalog";

type Previous = {
  product_id: string;
  /** Строка до изменения: `null` — её не было. */
  row: { id: string; category_id: string } | null;
  /** Созданная строка — откат её удалит. */
  created_id: string | null;
};

/** Одна строка на товар: создать, перенести на другую категорию или удалить. Откат возвращает как было. */
export const setProductMainCategoryStep = createStep(
  "set-product-main-category",
  async (change: ProductCatalogChange, { container }) => {
    if (change.main_category_id === undefined)
      return new StepResponse(undefined, null);

    const catalog = container.resolve<CatalogModuleService>(CATALOG_MODULE);
    const [row] = await catalog.listProductMainCategories({
      product_id: change.product_id,
    });
    const previous: Previous = {
      product_id: change.product_id,
      row: row ? { id: row.id, category_id: row.category_id } : null,
      created_id: null,
    };

    if (change.main_category_id === null) {
      if (row) await catalog.deleteProductMainCategories(row.id);
    } else if (row) {
      await catalog.updateProductMainCategories({
        id: row.id,
        category_id: change.main_category_id,
      });
    } else {
      const created = await catalog.createProductMainCategories({
        product_id: change.product_id,
        category_id: change.main_category_id,
      });
      previous.created_id = created.id;
    }
    return new StepResponse(undefined, previous);
  },
  async (previous, { container }) => {
    if (!previous) return;
    const catalog = container.resolve<CatalogModuleService>(CATALOG_MODULE);
    if (previous.created_id)
      await catalog.deleteProductMainCategories(previous.created_id);
    if (!previous.row) return;

    const [current] = await catalog.listProductMainCategories({
      id: previous.row.id,
    });
    if (current) await catalog.updateProductMainCategories(previous.row);
    else
      await catalog.createProductMainCategories({
        ...previous.row,
        product_id: previous.product_id,
      });
  },
);
