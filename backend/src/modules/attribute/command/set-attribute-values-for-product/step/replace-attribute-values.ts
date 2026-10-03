import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { ATTRIBUTE_MODULE } from "../../../index";
import type { AttributeModuleService } from "../../../service/attribute-module-service";
import type { AttributeValueRow } from "./build-attribute-values";

type Replaced = { removed: string[]; created: string[] };

/** Прежние значения области (товар или вариант) — мягко удаляются, новые создаются. Откат — наоборот. */
export const replaceAttributeValuesStep = createStep(
  "replace-attribute-values",
  async (
    input: {
      product_id: string;
      variant_id: string | null;
      rows: AttributeValueRow[];
    },
    { container },
  ) => {
    const attributes =
      container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
    const current = await attributes.listAttributeValues(
      { product_id: input.product_id, variant_id: input.variant_id },
      { select: ["id"] },
    );
    const removed = current.map((row) => row.id);
    if (removed.length) await attributes.softDeleteAttributeValues(removed);

    const created = input.rows.length
      ? await attributes.createAttributeValues(input.rows)
      : [];
    const replaced: Replaced = {
      removed,
      created: created.map((row) => row.id),
    };
    return new StepResponse(undefined, replaced);
  },
  async (replaced, { container }) => {
    if (!replaced) return;
    const attributes =
      container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
    if (replaced.created.length)
      await attributes.deleteAttributeValues(replaced.created);
    if (replaced.removed.length)
      await attributes.restoreAttributeValues(replaced.removed);
  },
);
