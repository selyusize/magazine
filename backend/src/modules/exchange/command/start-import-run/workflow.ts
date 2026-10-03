import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import type { StartImportRunCommand } from "./command";
import { createImportRunStep } from "./step/create-import-run";

/** Запуск сразу в очереди → событие `import_run.queued`: его обработает worker (`exchange-import-run-queued`). */
export const startImportRunWorkflow = createWorkflow("start-import-run", (command: StartImportRunCommand) => {
  const run = createImportRunStep(command);
  when("emit-import-run-queued", run, (run) => run.status === "queued").then(() => {
    emitEventStep({ eventName: "import_run.queued", data: transform(run, (run) => ({ id: run.id })) });
  });
  return new WorkflowResponse(run);
});
