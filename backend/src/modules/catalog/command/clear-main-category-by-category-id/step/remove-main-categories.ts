import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { CATALOG_MODULE } from "../../../index";
import type { CatalogModuleService } from "../../../service/catalog-module-service";
import type { ClearMainCategoryByCategoryIdCommand } from "../command";

/** Мягкое удаление строк «основная категория» с этой категорией; откат восстанавливает их. */
export const removeMainCategoriesStep = createStep(
  "remove-main-categories",
  async (command: ClearMainCategoryByCategoryIdCommand, { container }) => {
    const catalog = container.resolve<CatalogModuleService>(CATALOG_MODULE);
    const rows = await catalog.listProductMainCategories(
      { category_id: command.category_id },
      { select: ["id"] },
    );
    const ids = rows.map((row) => row.id);
    if (ids.length) await catalog.softDeleteProductMainCategories(ids);
    return new StepResponse(ids.length, ids);
  },
  async (ids, { container }) => {
    if (!ids?.length) return;
    const catalog = container.resolve<CatalogModuleService>(CATALOG_MODULE);
    await catalog.restoreProductMainCategories(ids);
  },
);
