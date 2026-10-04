import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { acquireLockStep, emitEventStep, releaseLockStep } from "@medusajs/medusa/core-flows";

import { revalidationLockKey, STOREFRONT_REVALIDATION_QUEUED } from "../../service/storefront-revalidation";
import type { QueueStorefrontRevalidationsCommand } from "./command";
import type { QueuedStorefrontRevalidationsDTO } from "./dto";
import { queueStorefrontRevalidationsStep } from "./step/queue-storefront-revalidations";

const lockKeys = (command: QueueStorefrontRevalidationsCommand): string[] =>
  [...new Set(command.batches.map((batch) => batch.shop_id))].map(revalidationLockKey);

/**
 * Дебаунс ревалидации: теги ложатся в ожидающую пачку магазина (её срок сдвигается на окно), нет пачки — новая и
 * событие `storefront_revalidation.queued` с задержкой на окно. Отправку ведёт `send-storefront-revalidation`.
 */
export const queueStorefrontRevalidationsWorkflow = createWorkflow(
  "queue-storefront-revalidations",
  (command: QueueStorefrontRevalidationsCommand) => {
    acquireLockStep({ key: transform(command, lockKeys), timeout: 30, ttl: 60 });
    const queued = queueStorefrontRevalidationsStep(command);
    emitEventStep({
      eventName: STOREFRONT_REVALIDATION_QUEUED,
      data: transform(queued, (queued) => queued.created.map((id) => ({ id }))),
      options: transform(queued, (queued) => ({ delay: queued.delay_ms })),
    });
    releaseLockStep({ key: transform(command, lockKeys) });
    return new WorkflowResponse(
      transform(queued, (queued): QueuedStorefrontRevalidationsDTO => ({ ids: queued.ids })),
    );
  },
);
