import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import type { CMLProperty } from "../../../service/commerceml/types";
import { nameKey } from "../../../service/imported-product";

export type LinkedProperty = CMLProperty & { attribute_id?: string };


/**
 * Только чтение: свойству без характеристики магазина подбирается характеристика с тем же названием
 * («Материал» → «Материал»). Уже сопоставленные в админке не трогаются — это решит шаг записи.
 */
export const linkExchangePropertiesStep = createStep(
  "link-exchange-properties",
  async (input: { supplier_id: string; properties: CMLProperty[] }, { container }) => {
    if (!input.properties.length) return new StepResponse<LinkedProperty[]>([]);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: attributes } = await query.graph({ entity: "attribute", fields: ["id", "name"] });
    const byName = new Map(attributes.map((attribute) => [nameKey(attribute.name), attribute.id]));

    return new StepResponse<LinkedProperty[]>(
      input.properties.map((property) => {
        const attributeId = byName.get(nameKey(property.name));
        return attributeId ? { ...property, attribute_id: attributeId } : property;
      }),
    );
  },
);
