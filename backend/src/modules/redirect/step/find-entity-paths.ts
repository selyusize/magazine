import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { toURLEntityRows, URL_ENTITIES, type URLEntityType } from "../service/path";
import type { EntityPathInput } from "../service/redirect-module-service";
import { findEntityShop } from "./find-entity-shop";

/**
 * Общий шаг команд модуля, только чтение: текущие пути сущностей по фильтру (посадочные одной категории) — каждый
 * в магазине сущности; сущность без магазина пропускается.
 */
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

    const paths: EntityPathInput[] = [];
    for (const row of toURLEntityRows(data)) {
      const path = config.toPath(row);
      const shop = path ? await findEntityShop(query, config.shopOf(row)) : null;
      if (path && shop) paths.push({ shop_id: shop.id, entity_type: input.entity_type, entity_id: row.id, path });
    }
    return new StepResponse(paths);
  },
);
