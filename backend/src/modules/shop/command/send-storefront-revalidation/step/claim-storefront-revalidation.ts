import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";

import { SHOP_MODULE } from "../../../index";
import { RevalidationSchedule } from "../../../service/revalidation-schedule";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { SendStorefrontRevalidationCommand } from "../command";

/** Что делать с пачкой: отправить, подождать до срока (дебаунс сдвинул его) или ничего (уже отправлена). */
export type RevalidationClaim = {
  action: "skip" | "wait" | "send";
  id: string;
  shop_id: string;
  tags: string[];
  attempts: number;
  /** Остаток до срока — для `wait`. */
  delay_ms: number;
};

/**
 * Захват пачки под блокировкой магазина: срок подошёл — `sending` (новые теги пойдут в новую пачку), не подошёл —
 * ждать остаток, не `pending` — повторное событие, пропуск. Откат возвращает `pending`.
 */
export const claimStorefrontRevalidationStep = createStep(
  "claim-storefront-revalidation",
  async ({ id }: SendStorefrontRevalidationCommand, { container }) => {
    const service = container.resolve<ShopModuleService>(SHOP_MODULE);
    const schedule = Container.from(container).get(RevalidationSchedule);
    const [row] = await service.listStorefrontRevalidations({ id }, { take: 1 });
    if (row?.status !== "pending") {
      return new StepResponse<RevalidationClaim, string | null>(
        { action: "skip", id, shop_id: row?.shop_id ?? "", tags: [], attempts: 0, delay_ms: 0 },
        null,
      );
    }

    const claim = { id, shop_id: row.shop_id, tags: row.tags, attempts: row.attempts };
    const delay_ms = schedule.delayUntil({ now: new Date(), due_at: new Date(row.due_at) });
    if (delay_ms > 0) {
      return new StepResponse<RevalidationClaim, string | null>({ ...claim, action: "wait", delay_ms }, null);
    }

    await service.updateStorefrontRevalidations({ id, status: "sending" });
    return new StepResponse<RevalidationClaim, string | null>({ ...claim, action: "send", delay_ms: 0 }, id);
  },
  async (claimedId, { container }) => {
    if (!claimedId) return;
    await container
      .resolve<ShopModuleService>(SHOP_MODULE)
      .updateStorefrontRevalidations({ id: claimedId, status: "pending" });
  },
);
