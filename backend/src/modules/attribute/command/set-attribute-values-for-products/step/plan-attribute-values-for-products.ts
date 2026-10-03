import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { parseAttributeValue, toAttributeRef } from "../../../service/attribute-value";
import type { AttributeValueRow } from "../../set-attribute-values-for-product/step/build-attribute-values";
import type { SetAttributeValuesForProductsCommand } from "../command";
import type { SavedAttributeValuesDTO } from "../dto";

export type AttributeValuesForProductsPlan = SavedAttributeValuesDTO & { rows: AttributeValueRow[] };

/** Набор значений товара для сравнения: характеристика + slug значения. */
const signature = (rows: { attribute_id: string; handle: string }[]) =>
  rows
    .map((row) => `${row.attribute_id}:${row.handle}`)
    .sort()
    .join("|");

/**
 * Только чтение: значения приводятся к типам характеристик (неподходящие и неизвестные характеристики — в ошибки,
 * без падения пачки), совпадающие с текущими наборы отбрасываются — повторный импорт ничего не пишет.
 */
export const planAttributeValuesForProductsStep = createStep(
  "plan-attribute-values-for-products",
  async (command: SetAttributeValuesForProductsCommand, { container }) => {
    const plan: AttributeValuesForProductsPlan = { changed_product_ids: [], errors: [], rows: [] };
    if (!command.items.length) return new StepResponse(plan);

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const attributeIds = [...new Set(command.items.flatMap((item) => item.values.map((value) => value.attribute_id)))];
    const productIds = command.items.map((item) => item.product_id);
    const [{ data: attributes }, { data: current }] = await Promise.all([
      attributeIds.length
        ? query.graph({ entity: "attribute", fields: ["id", "name", "type"], filters: { id: attributeIds } })
        : { data: [] },
      query.graph({
        entity: "attribute_value",
        fields: ["product_id", "attribute_id", "handle"],
        filters: { product_id: productIds, variant_id: null },
      }),
    ]);
    const byId = new Map(attributes.map(toAttributeRef).map((attribute) => [attribute.id, attribute]));

    for (const item of command.items) {
      const rows = new Map<string, AttributeValueRow>();
      for (const input of item.values) {
        const attribute = byId.get(input.attribute_id);
        if (!attribute) {
          plan.errors.push({ product_id: item.product_id, message: `Характеристика ${input.attribute_id} не найдена` });
          continue;
        }
        const parsed = parseAttributeValue(attribute, input.value);
        if (parsed.error !== undefined) {
          plan.errors.push({ product_id: item.product_id, message: parsed.error });
          continue;
        }
        if (!parsed.value) continue;
        rows.set(`${attribute.id}:${parsed.value.handle}`, {
          attribute_id: attribute.id,
          product_id: item.product_id,
          variant_id: null,
          ...parsed.value,
        });
      }

      const existing = current.filter((row) => row.product_id === item.product_id);
      if (signature([...rows.values()]) === signature(existing)) continue;
      plan.changed_product_ids.push(item.product_id);
      plan.rows.push(...rows.values());
    }
    return new StepResponse(plan);
  },
);
