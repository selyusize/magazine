import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

import { findSupplierShopStep } from "../../step/find-supplier-shop";
import type { SaveExchangeClassifierCommand } from "./command";
import type { SavedExchangeClassifierDTO } from "./dto";
import { linkExchangePropertiesStep } from "./step/link-exchange-properties";
import { saveExchangeGroupsStep } from "./step/save-exchange-groups";
import { saveExchangePropertiesStep } from "./step/save-exchange-properties";

/** Справочники поставщика для маппинга: группы → категории, свойства → характеристики его магазина. */
export const saveExchangeClassifierWorkflow = createWorkflow(
  "save-exchange-classifier",
  (command: SaveExchangeClassifierCommand) => {
    const groups = saveExchangeGroupsStep(
      transform(command, (command) => ({ supplier_id: command.supplier_id, rows: command.groups })),
    );
    const shop = findSupplierShopStep(transform(command, (command) => ({ supplier_id: command.supplier_id })));
    const linked = linkExchangePropertiesStep(
      transform({ command, shop }, ({ command, shop }) => ({
        shop_id: shop.shop_id,
        properties: command.properties,
      })),
    );
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
