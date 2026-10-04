import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

import { STOREFRONT_REVALIDATION_QUEUED } from "../../service/storefront-revalidation";
import type { RequeueStaleStorefrontRevalidationsCommand } from "./command";
import type { RequeuedStorefrontRevalidationsDTO } from "./dto";
import { resetStaleStorefrontRevalidationsStep } from "./step/reset-stale-storefront-revalidations";

/**
 * Потерянные таймеры: пачка давно просрочена в `pending` (событие с задержкой не дошло) или застряла в `sending`
 * (worker упал на отправке) — снова `pending` и событие без задержки.
 */
export const requeueStaleStorefrontRevalidationsWorkflow = createWorkflow(
  "requeue-stale-storefront-revalidations",
  (command: RequeueStaleStorefrontRevalidationsCommand) => {
    const ids = resetStaleStorefrontRevalidationsStep(command);
    emitEventStep({
      eventName: STOREFRONT_REVALIDATION_QUEUED,
      data: transform(ids, (ids) => ids.map((id) => ({ id }))),
    });
    return new WorkflowResponse(transform(ids, (ids): RequeuedStorefrontRevalidationsDTO => ({ ids })));
  },
);
