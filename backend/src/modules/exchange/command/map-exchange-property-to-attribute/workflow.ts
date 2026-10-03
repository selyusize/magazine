import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

import type { MapExchangePropertyToAttributeCommand } from "./command";
import { setExchangePropertyAttributeStep } from "./step/set-exchange-property-attribute";

export const mapExchangePropertyToAttributeWorkflow = createWorkflow(
  "map-exchange-property-to-attribute",
  (command: MapExchangePropertyToAttributeCommand) => new WorkflowResponse(setExchangePropertyAttributeStep(command)),
);
