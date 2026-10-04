import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

import type { RegenerateRevalidateSecretForShopCommand } from "./command";
import { replaceRevalidateSecretStep } from "./step/replace-revalidate-secret";

/**
 * Перевыпуск секрета: до обновления env фронта (Ansible) вебхуки получают 401 и уходят в повторы — журнал это
 * покажет, а TTL витрины держит её в рабочем состоянии.
 */
export const regenerateRevalidateSecretForShopWorkflow = createWorkflow(
  "regenerate-revalidate-secret-for-shop",
  (command: RegenerateRevalidateSecretForShopCommand) => new WorkflowResponse(replaceRevalidateSecretStep(command)),
);
