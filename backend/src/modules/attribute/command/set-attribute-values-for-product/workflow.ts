import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows";

import {
  ATTRIBUTE_VALUE_FIELDS,
  toAttributeValueDTOs,
} from "../../query/get-attribute-values-by-product-id/fetcher";
import type { SetAttributeValuesForProductCommand } from "./command";
import type { SavedAttributeValueDTO } from "./dto";
import { buildAttributeValuesStep } from "./step/build-attribute-values";
import { replaceAttributeValuesStep } from "./step/replace-attribute-values";

/** Характеристики — фильтры каталога и `additionalProperty` в разметке: событие `product.updated` для индекса и кэша. */
export const setAttributeValuesForProductWorkflow = createWorkflow(
  "set-attribute-values-for-product",
  (command: SetAttributeValuesForProductCommand) => {
    const rows = buildAttributeValuesStep(command);
    replaceAttributeValuesStep(
      transform({ command, rows }, ({ command, rows }) => ({
        product_id: command.product_id,
        variant_id: command.variant_id,
        rows,
      })),
    );
    emitEventStep({
      eventName: "product.updated",
      data: transform(command, (command) => ({ id: command.product_id })),
    });

    const { data } = useQueryGraphStep({
      entity: "attribute_value",
      fields: ATTRIBUTE_VALUE_FIELDS,
      filters: transform(command, (command) => ({
        product_id: command.product_id,
      })),
    });
    return new WorkflowResponse(
      transform(data, (data): SavedAttributeValueDTO[] =>
        toAttributeValueDTOs(data),
      ),
    );
  },
);
