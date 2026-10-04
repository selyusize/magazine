import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  emitEventStep,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";

import { records, text } from "@shared/query/narrow";

import { revalidationLockKey, STOREFRONT_REVALIDATION_QUEUED } from "../../service/storefront-revalidation";
import type { SendStorefrontRevalidationCommand } from "./command";
import { claimStorefrontRevalidationStep } from "./step/claim-storefront-revalidation";
import { postStorefrontRevalidationStep } from "./step/post-storefront-revalidation";
import { recordStorefrontRevalidationStep } from "./step/record-storefront-revalidation";

/**
 * Отправка пачки: захват под блокировкой магазина (с очередью тегов не пересекается) → вебхук витрине → итог в
 * журнал. Срок сдвинул дебаунс — событие с задержкой на остаток; неудача — событие с паузой повтора. Таймеры —
 * задержанные события шины (Redis/BullMQ), потерянные подбирает job `shop-requeue-storefront-revalidations`.
 */
export const sendStorefrontRevalidationWorkflow = createWorkflow(
  "send-storefront-revalidation",
  (command: SendStorefrontRevalidationCommand) => {
    const { data: rows } = useQueryGraphStep({
      entity: "storefront_revalidation",
      fields: ["id", "shop_id"],
      filters: transform(command, (command) => ({ id: command.id })),
    }).config({ name: "find-storefront-revalidation" });
    const lockKey = transform(rows, (rows) => revalidationLockKey(text(records(rows)[0]?.shop_id, "none")));

    acquireLockStep({ key: lockKey, timeout: 30, ttl: 60 });
    const claim = claimStorefrontRevalidationStep(command);
    releaseLockStep({ key: lockKey });

    when("wait-storefront-revalidation", claim, (claim) => claim.action === "wait").then(() => {
      emitEventStep({
        eventName: STOREFRONT_REVALIDATION_QUEUED,
        data: transform(claim, (claim) => ({ id: claim.id })),
        options: transform(claim, (claim) => ({ delay: claim.delay_ms })),
      }).config({ name: "emit-storefront-revalidation-wait" });
    });

    const recorded = when("post-storefront-revalidation", claim, (claim) => claim.action === "send").then(() => {
      const result = postStorefrontRevalidationStep(
        transform(claim, (claim) => ({ shop_id: claim.shop_id, tags: claim.tags })),
      );
      return recordStorefrontRevalidationStep(
        transform({ claim, result }, ({ claim, result }) => ({ id: claim.id, attempts: claim.attempts, result })),
      );
    });

    when("retry-storefront-revalidation", { recorded }, ({ recorded }) => recorded?.retry_delay_ms != null).then(() => {
      emitEventStep({
        eventName: STOREFRONT_REVALIDATION_QUEUED,
        data: transform({ recorded }, ({ recorded }) => ({ id: recorded?.id })),
        options: transform({ recorded }, ({ recorded }) => ({ delay: recorded?.retry_delay_ms ?? 0 })),
      }).config({ name: "emit-storefront-revalidation-retry" });
    });

    return new WorkflowResponse(undefined);
  },
);
