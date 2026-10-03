import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

import { updateImportRunStep } from "../../step/update-import-run";
import type { SaveImportRunProgressCommand } from "./command";

/** Без события: ход запуска читает админка, а итог приходит событием `finish-import-run`. */
export const saveImportRunProgressWorkflow = createWorkflow(
  "save-import-run-progress",
  (command: SaveImportRunProgressCommand) => {
    updateImportRunStep(transform(command, (command) => ({ id: command.id, patch: command.patch })));
    return new WorkflowResponse(undefined);
  },
);
