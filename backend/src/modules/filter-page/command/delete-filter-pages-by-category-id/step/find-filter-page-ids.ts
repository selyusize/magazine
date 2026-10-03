import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import type { DeleteFilterPagesByCategoryIdCommand } from "../command";

/** Только чтение: id посадочных категории. */
export const findFilterPageIdsStep = createStep(
  "find-filter-page-ids",
  async (command: DeleteFilterPagesByCategoryIdCommand, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data } = await query.graph({
      entity: "filter_page",
      fields: ["id"],
      filters: { category_id: command.category_id },
    });
    return new StepResponse(data.map((row) => row.id));
  },
);
