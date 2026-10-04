import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";

import { SHOP_MODULE } from "../../../index";
import { RevalidationSchedule } from "../../../service/revalidation-schedule";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { RequeueStaleStorefrontRevalidationsCommand } from "../command";

/** Просрочка, после которой таймер `pending` считается потерянным: срок плюс запас на очередь шины. */
const LOST_TIMER_MS = 60_000;
const BATCH = 500;

/** Просроченные `pending` и зависшие `sending`; зависшие — обратно в `pending`. Откат возвращает `sending`. */
export const resetStaleStorefrontRevalidationsStep = createStep(
  "reset-stale-storefront-revalidations",
  async ({ now }: RequeueStaleStorefrontRevalidationsCommand, { container }) => {
    const service = container.resolve<ShopModuleService>(SHOP_MODULE);
    const { stale_sending_ms } = Container.from(container).get(RevalidationSchedule).options;
    const at = new Date(now).getTime();

    const lost = await service.listStorefrontRevalidations(
      { status: "pending", due_at: { $lt: new Date(at - LOST_TIMER_MS) } },
      { select: ["id"], take: BATCH },
    );
    const stuck = await service.listStorefrontRevalidations(
      { status: "sending", updated_at: { $lt: new Date(at - stale_sending_ms) } },
      { select: ["id"], take: BATCH },
    );
    const stuckIds = stuck.map((row) => row.id);
    if (stuckIds.length) {
      await service.updateStorefrontRevalidations({ selector: { id: stuckIds }, data: { status: "pending" } });
    }

    return new StepResponse(
      [...lost.map((row) => row.id), ...stuckIds],
      stuckIds,
    );
  },
  async (stuckIds, { container }) => {
    if (!stuckIds?.length) return;
    await container
      .resolve<ShopModuleService>(SHOP_MODULE)
      .updateStorefrontRevalidations({ selector: { id: stuckIds }, data: { status: "sending" } });
  },
);
