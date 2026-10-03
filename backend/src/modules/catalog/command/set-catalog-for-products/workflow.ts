import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import type { SetCatalogForProductsCommand } from "./command";
import { planCatalogForProductsStep } from "./step/plan-catalog-for-products";
import { setBrandsForProductsStep } from "./step/set-brands-for-products";
import { setMainCategoriesForProductsStep } from "./step/set-main-categories-for-products";

/**
 * Пакетная версия `update-catalog-for-product`: одна проверка и одна запись на пачку. Событие `product.updated` —
 * одним вызовом на все изменённые товары (индекс и ревалидация витрины, этап 9).
 */
export const setCatalogForProductsWorkflow = createWorkflow(
  "set-catalog-for-products",
  (command: SetCatalogForProductsCommand) => {
    const plan = planCatalogForProductsStep(command);
    setBrandsForProductsStep(transform(plan, (plan) => plan.brands));
    setMainCategoriesForProductsStep(transform(plan, (plan) => plan.categories));
    emitEventStep({
      eventName: "product.updated",
      data: transform(plan, (plan) =>
        [...new Set([...plan.brands, ...plan.categories].map((change) => change.product_id))].map((id) => ({ id })),
      ),
    });
    return new WorkflowResponse(undefined);
  },
);
