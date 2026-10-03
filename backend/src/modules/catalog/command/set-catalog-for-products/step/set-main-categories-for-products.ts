import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { CATALOG_MODULE } from "../../../index";
import type { CatalogModuleService } from "../../../service/catalog-module-service";
import type { CatalogForProductsPlan } from "./plan-catalog-for-products";

type Undo = {
  created: string[];
  updated: { id: string; category_id: string }[];
  deleted: string[];
};

/** Строки «основная категория» пачкой: создать, перенести, снять (мягко). Откат возвращает как было. */
export const setMainCategoriesForProductsStep = createStep(
  "set-main-categories-for-products",
  async (changes: CatalogForProductsPlan["categories"], { container }) => {
    const undo: Undo = { created: [], updated: [], deleted: [] };
    if (!changes.length) return new StepResponse(undefined, undo);
    const catalog = container.resolve<CatalogModuleService>(CATALOG_MODULE);

    const toCreate = changes.filter((change) => !change.row && change.next);
    const toUpdate = changes.filter((change) => change.row && change.next);
    const toDelete = changes.filter((change) => change.row && !change.next);

    if (toCreate.length) {
      const created = await catalog.createProductMainCategories(
        toCreate.map((change) => ({ product_id: change.product_id, category_id: change.next! })),
      );
      undo.created = created.map((row) => row.id);
    }
    if (toUpdate.length) {
      await catalog.updateProductMainCategories(
        toUpdate.map((change) => ({ id: change.row!.id, category_id: change.next! })),
      );
      undo.updated = toUpdate.map((change) => change.row!);
    }
    if (toDelete.length) {
      undo.deleted = toDelete.map((change) => change.row!.id);
      await catalog.softDeleteProductMainCategories(undo.deleted);
    }
    return new StepResponse(undefined, undo);
  },
  async (undo, { container }) => {
    if (!undo) return;
    const catalog = container.resolve<CatalogModuleService>(CATALOG_MODULE);
    if (undo.created.length) await catalog.deleteProductMainCategories(undo.created);
    if (undo.updated.length) await catalog.updateProductMainCategories(undo.updated);
    if (undo.deleted.length) await catalog.restoreProductMainCategories(undo.deleted);
  },
);
