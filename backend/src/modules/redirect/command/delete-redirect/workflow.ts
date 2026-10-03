import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import type { DeleteRedirectCommand } from "./command";
import { removeRedirectStep } from "./step/remove-redirect";

export const deleteRedirectWorkflow = createWorkflow(
  "delete-redirect",
  (command: DeleteRedirectCommand) => {
    removeRedirectStep(command);
    return new WorkflowResponse(undefined);
  },
);
