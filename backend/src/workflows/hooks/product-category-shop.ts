import { StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";

import { Container } from "@container/index";
import { isShopRootCategoryData } from "@shared/shop/catalog-shop";
import { AssignShopToCategoriesHandler } from "@domain/catalog/command/assign-shop-to-categories/handler";
import { RemoveShopFromCategoriesHandler } from "@domain/catalog/command/remove-shop-from-categories/handler";
import { CategoryShopGuard } from "@domain/catalog/service/category-shop-guard";

/**
 * Дерево категорий магазина (план, шаг 4): новая категория получает магазин родителя, без родителя — 400 (корень
 * создаёт только `create-shop`); изменённая должна остаться в своём дереве. Откат создания снимает связи.
 */
createProductCategoriesWorkflow.hooks.categoriesCreated(
  async ({ categories, additional_data }, { container }) => {
    if (isShopRootCategoryData(additional_data)) return new StepResponse(undefined, []);
    const links = await Container.from(container)
      .get(AssignShopToCategoriesHandler)
      .handle({ category_ids: categories.map((category) => category.id) });
    return new StepResponse(undefined, links);
  },
  async (links, { container }) => {
    if (!links?.length) return;
    await Container.from(container).get(RemoveShopFromCategoriesHandler).handle({ links });
  },
);

updateProductCategoriesWorkflow.hooks.categoriesUpdated(
  async ({ categories }, { container }) => {
    const ids = (Array.isArray(categories) ? categories : [categories]).map((category) => category.id);
    await Container.from(container).get(CategoryShopGuard).assert(ids);
  },
);
