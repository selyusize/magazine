import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import { updateImportRunStep } from "../../step/update-import-run";
import type { FinishImportRunCommand } from "./command";

/**
 * Событие `import_run.completed` или `import_run.failed` — одно на запуск (не на товар): по нему ревалидация витрины,
 * фиды и sitemap (этапы 9, 10, 13), письмо о сбое (этап 17).
 */
export const finishImportRunWorkflow = createWorkflow("finish-import-run", (command: FinishImportRunCommand) => {
  const run = updateImportRunStep(
    transform(command, (command) => ({
      id: command.id,
      patch: { status: command.status, message: command.message, finished_at: new Date().toISOString() },
    })),
  );
  emitEventStep({
    eventName: transform(command, (command) => (command.status === "done" ? "import_run.completed" : "import_run.failed")),
    data: transform(run, (run) => ({ id: run.id, supplier_id: run.supplier_id })),
  });
  return new WorkflowResponse(undefined);
});
