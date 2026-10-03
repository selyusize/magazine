import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  batchInventoryItemLevelsWorkflow,
  releaseLockStep,
} from "@medusajs/medusa/core-flows";

import type { SyncInventoryForVariantsCommand } from "./command";
import { planInventoryLevelsStep } from "./step/plan-inventory-levels";

/** Расчёт и запись — под одной блокировкой: два параллельных пересчёта создали бы один уровень дважды. */
const LOCK_KEY = "supplier-inventory";

/**
 * Остатки предложений → уровни inventory на складах поставщиков. Запись — готовым workflow Medusa (с откатом
 * и событиями inventory). Идемпотентен: совпадающие уровни не пишутся.
 */
export const syncInventoryForVariantsWorkflow = createWorkflow(
  "sync-inventory-for-variants",
  (command: SyncInventoryForVariantsCommand) => {
    acquireLockStep({ key: LOCK_KEY, timeout: 60, ttl: 120 });
    const plan = planInventoryLevelsStep(command);
    when(
      "write-inventory-levels",
      plan,
      (plan) => plan.create.length > 0 || plan.update.length > 0,
    ).then(() => {
      batchInventoryItemLevelsWorkflow.runAsStep({
        input: transform(plan, (plan) => ({
          create: plan.create,
          update: plan.update,
        })),
      });
    });
    releaseLockStep({ key: LOCK_KEY });
    return new WorkflowResponse(undefined);
  },
);
