import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

import type { MapExchangeGroupToCategoryCommand } from "./command";
import { setExchangeGroupCategoryStep } from "./step/set-exchange-group-category";

export const mapExchangeGroupToCategoryWorkflow = createWorkflow(
  "map-exchange-group-to-category",
  (command: MapExchangeGroupToCategoryCommand) => new WorkflowResponse(setExchangeGroupCategoryStep(command)),
);
