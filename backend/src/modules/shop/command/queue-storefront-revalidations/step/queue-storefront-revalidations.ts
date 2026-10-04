import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";

import { SHOP_MODULE } from "../../../index";
import { RevalidationSchedule } from "../../../service/revalidation-schedule";
import type { ShopModuleService } from "../../../service/shop-module-service";
import { groupBatchesByShop } from "../../../service/storefront-revalidation";
import type { QueueStorefrontRevalidationsCommand } from "../command";

type Queued = {
  /** Все пачки, куда легли теги. */
  ids: string[];
  /** Новые пачки — им нужен таймер (событие с задержкой). */
  created: string[];
  delay_ms: number;
};

type Previous = {
  created: string[];
  updated: { id: string; tags: string[]; due_at: Date }[];
};

/**
 * Теги — в ожидающую пачку магазина: есть — дополняет и сдвигает срок на окно (пачку на повторе не трогает: витрина
 * лежит, чаще стучаться незачем), нет — создаёт. Откат удаляет созданные и возвращает прежние теги и сроки.
 */
export const queueStorefrontRevalidationsStep = createStep(
  "queue-storefront-revalidations",
  async (command: QueueStorefrontRevalidationsCommand, { container }) => {
    const service = container.resolve<ShopModuleService>(SHOP_MODULE);
    const schedule = Container.from(container).get(RevalidationSchedule);
    const now = new Date();
    const queued: Queued = { ids: [], created: [], delay_ms: schedule.options.window_ms };
    const previous: Previous = { created: [], updated: [] };

    for (const batch of groupBatchesByShop(command.batches)) {
      const [pending] = await service.listStorefrontRevalidations(
        { shop_id: batch.shop_id, status: "pending" },
        { take: 1, order: { created_at: "DESC" } },
      );

      if (pending) {
        await service.updateStorefrontRevalidations({
          id: pending.id,
          tags: schedule.mergeTags(pending.tags, batch.tags),
          due_at:
            pending.attempts > 0
              ? pending.due_at
              : schedule.dueAt({ now, first_queued_at: new Date(pending.first_queued_at) }),
        });
        previous.updated.push({ id: pending.id, tags: pending.tags, due_at: pending.due_at });
        queued.ids.push(pending.id);
        continue;
      }

      const created = await service.createStorefrontRevalidations({
        shop_id: batch.shop_id,
        tags: schedule.mergeTags([], batch.tags),
        status: "pending",
        attempts: 0,
        first_queued_at: now,
        due_at: schedule.dueAt({ now, first_queued_at: now }),
      });
      previous.created.push(created.id);
      queued.ids.push(created.id);
      queued.created.push(created.id);
    }

    return new StepResponse(queued, previous);
  },
  async (previous, { container }) => {
    if (!previous) return;
    const service = container.resolve<ShopModuleService>(SHOP_MODULE);
    if (previous.created.length) await service.deleteStorefrontRevalidations(previous.created);
    for (const row of previous.updated) await service.updateStorefrontRevalidations(row);
  },
);
