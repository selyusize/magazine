import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { ATTRIBUTE_MODULE } from "../../../index";
import type { AttributeModuleService } from "../../../service/attribute-module-service";
import type { AttributeValuesForProductsPlan } from "./plan-attribute-values-for-products";

/** Прежние значения товаров пачки мягко удаляются, новые создаются. Откат — наоборот. */
export const replaceAttributeValuesForProductsStep = createStep(
  "replace-attribute-values-for-products",
  async (plan: Pick<AttributeValuesForProductsPlan, "changed_product_ids" | "rows">, { container }) => {
    const replaced: { removed: string[]; created: string[] } = { removed: [], created: [] };
    if (!plan.changed_product_ids.length) return new StepResponse(undefined, replaced);

    const attributes = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
    const current = await attributes.listAttributeValues(
      { product_id: plan.changed_product_ids, variant_id: null },
      { select: ["id"] },
    );
    replaced.removed = current.map((row) => row.id);
    if (replaced.removed.length) await attributes.softDeleteAttributeValues(replaced.removed);

    if (plan.rows.length) {
      const created = await attributes.createAttributeValues(plan.rows);
      replaced.created = created.map((row) => row.id);
    }
    return new StepResponse(undefined, replaced);
  },
  async (replaced, { container }) => {
    if (!replaced) return;
    const attributes = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
    if (replaced.created.length) await attributes.deleteAttributeValues(replaced.created);
    if (replaced.removed.length) await attributes.restoreAttributeValues(replaced.removed);
  },
);
