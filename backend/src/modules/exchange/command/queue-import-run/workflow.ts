import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import { updateImportRunStep } from "../../step/update-import-run";
import type { QueueImportRunCommand } from "./command";
import type { QueuedImportRunDTO } from "./dto";

/** Статус → `queued` и событие `import_run.queued`; повторный вызов при другом статусе ничего не делает. */
export const queueImportRunWorkflow = createWorkflow("queue-import-run", (command: QueueImportRunCommand) => {
  const run = updateImportRunStep(
    transform(command, (command) => ({
      id: command.id,
      from: command.from,
      patch: { status: "queued" as const, message: null },
    })),
  );
  when("emit-import-run-requeued", run, (run) => run.changed).then(() => {
    emitEventStep({ eventName: "import_run.queued", data: transform(run, (run) => ({ id: run.id })) });
  });
  return new WorkflowResponse(
    transform(run, (run): QueuedImportRunDTO => ({ id: run.id, status: run.status, queued: run.changed })),
  );
});
