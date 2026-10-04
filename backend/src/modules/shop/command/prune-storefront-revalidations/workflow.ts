import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

import type { PruneStorefrontRevalidationsCommand } from "./command";
import { deleteOldStorefrontRevalidationsStep } from "./step/delete-old-storefront-revalidations";

/** Журнал отправок хранится `keep_days` дней (`src/container/common/cache.ts`), ожидающие пачки не трогаются. */
export const pruneStorefrontRevalidationsWorkflow = createWorkflow(
  "prune-storefront-revalidations",
  (command: PruneStorefrontRevalidationsCommand) =>
    new WorkflowResponse(deleteOldStorefrontRevalidationsStep(command)),
);
