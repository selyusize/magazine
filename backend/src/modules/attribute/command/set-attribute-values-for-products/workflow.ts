import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import type { SetAttributeValuesForProductsCommand } from "./command";
import type { SavedAttributeValuesDTO } from "./dto";
import { planAttributeValuesForProductsStep } from "./step/plan-attribute-values-for-products";
import { replaceAttributeValuesForProductsStep } from "./step/replace-attribute-values-for-products";

/** Пакетная версия `set-attribute-values-for-product`: одно событие `product.updated` на изменённые товары. */
export const setAttributeValuesForProductsWorkflow = createWorkflow(
  "set-attribute-values-for-products",
  (command: SetAttributeValuesForProductsCommand) => {
    const plan = planAttributeValuesForProductsStep(command);
    replaceAttributeValuesForProductsStep(plan);
    emitEventStep({
      eventName: "product.updated",
      data: transform(plan, (plan) => plan.changed_product_ids.map((id) => ({ id }))),
    });
    return new WorkflowResponse(
      transform(plan, (plan): SavedAttributeValuesDTO => ({
        changed_product_ids: plan.changed_product_ids,
        errors: plan.errors,
      })),
    );
  },
);
