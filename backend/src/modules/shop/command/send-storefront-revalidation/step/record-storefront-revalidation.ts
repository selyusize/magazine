import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";

import { SHOP_MODULE } from "../../../index";
import type { StorefrontRevalidationEntity } from "../../../entity/storefront-revalidation";
import { RevalidationSchedule } from "../../../service/revalidation-schedule";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { PostedRevalidation } from "./post-storefront-revalidation";

type Recorded = {
  id: string;
  /** Через сколько повторить; `null` — повтора не будет. */
  retry_delay_ms: number | null;
};

type Previous = Pick<
  StorefrontRevalidationEntity,
  "id" | "status" | "attempts" | "due_at" | "sent_at" | "response_status" | "error"
>;

/**
 * Итог отправки в журнал: успех — `sent`; неудача — `pending` с паузой по таблице повторов или `failed`, когда
 * повторы кончились или повтор не поможет. Откат возвращает строку как было.
 */
export const recordStorefrontRevalidationStep = createStep(
  "record-storefront-revalidation",
  async (
    { id, attempts, result }: { id: string; attempts: number; result: PostedRevalidation },
    { container },
  ) => {
    const service = container.resolve<ShopModuleService>(SHOP_MODULE);
    const schedule = Container.from(container).get(RevalidationSchedule);
    const before = await service.retrieveStorefrontRevalidation(id);
    const previous: Previous = {
      id,
      status: before.status,
      attempts: before.attempts,
      due_at: before.due_at,
      sent_at: before.sent_at,
      response_status: before.response_status,
      error: before.error,
    };
    const now = new Date();

    if (result.ok) {
      await service.updateStorefrontRevalidations({
        id,
        status: "sent",
        sent_at: now,
        response_status: result.status,
        error: null,
      });
      return new StepResponse<Recorded, Previous>({ id, retry_delay_ms: null }, previous);
    }

    const failures = attempts + 1;
    const retry_delay_ms = !result.ok && result.retryable ? schedule.retryDelay(failures) : null;
    await service.updateStorefrontRevalidations({
      id,
      status: retry_delay_ms === null ? "failed" : "pending",
      attempts: failures,
      due_at: retry_delay_ms === null ? before.due_at : new Date(now.getTime() + retry_delay_ms),
      response_status: result.status,
      error: result.ok ? null : result.error,
    });
    return new StepResponse<Recorded, Previous>({ id, retry_delay_ms }, previous);
  },
  async (previous, { container }) => {
    if (!previous) return;
    await container.resolve<ShopModuleService>(SHOP_MODULE).updateStorefrontRevalidations(previous);
  },
);
