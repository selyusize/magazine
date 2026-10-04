import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import { REDIRECT_UPDATED, toRedirectEventData } from "../../service/redirect-events";

import type { DeleteRedirectCommand } from "./command";
import { removeRedirectStep } from "./step/remove-redirect";

export const deleteRedirectWorkflow = createWorkflow(
  "delete-redirect",
  (command: DeleteRedirectCommand) => {
    const removed = removeRedirectStep(command);
    emitEventStep({
      eventName: REDIRECT_UPDATED,
      data: transform(removed, (removed) => toRedirectEventData([removed.shop_id])),
    });
    return new WorkflowResponse(undefined);
  },
);
