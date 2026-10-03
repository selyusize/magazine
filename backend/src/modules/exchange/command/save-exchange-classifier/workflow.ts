import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

import type { SaveExchangeClassifierCommand } from "./command";
import type { SavedExchangeClassifierDTO } from "./dto";
import { linkExchangePropertiesStep } from "./step/link-exchange-properties";
import { saveExchangeGroupsStep } from "./step/save-exchange-groups";
import { saveExchangePropertiesStep } from "./step/save-exchange-properties";

/** Справочники поставщика для маппинга: группы → категории, свойства → характеристики магазина. */
export const saveExchangeClassifierWorkflow = createWorkflow(
  "save-exchange-classifier",
  (command: SaveExchangeClassifierCommand) => {
    const groups = saveExchangeGroupsStep(
      transform(command, (command) => ({ supplier_id: command.supplier_id, rows: command.groups })),
    );
    const linked = linkExchangePropertiesStep(command);
    const properties = saveExchangePropertiesStep(
      transform({ command, linked }, ({ command, linked }) => ({ supplier_id: command.supplier_id, rows: linked })),
    );
    return new WorkflowResponse(
      transform({ groups, properties, linked }, ({ groups, properties, linked }): SavedExchangeClassifierDTO => ({
        groups: { created: groups.created, updated: groups.updated },
        properties: {
          created: properties.created,
          updated: properties.updated,
          linked: linked.filter((property) => property.attribute_id).length,
        },
      })),
    );
  },
);
