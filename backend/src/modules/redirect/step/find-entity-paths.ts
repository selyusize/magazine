import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { toURLEntityRows, URL_ENTITIES, type URLEntityType } from "../service/path";
import type { EntityPathInput } from "../service/redirect-module-service";

/** Общий шаг команд модуля, только чтение: текущие пути сущностей по фильтру (посадочные одной категории). */
export const findEntityPathsStep = createStep(
  "find-entity-paths",
  async (
    input: { entity_type: URLEntityType; filters: Record<string, string> },
    { container },
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const config = URL_ENTITIES[input.entity_type];
    const { data } = await query.graph({
      entity: config.entity,
      fields: config.fields,
      filters: input.filters,
    });

    const paths = toURLEntityRows(data).flatMap((row): EntityPathInput[] => {
      const path = config.toPath(row);
      return path
        ? [{ entity_type: input.entity_type, entity_id: row.id, path }]
        : [];
    });
    return new StepResponse(paths);
  },
);
