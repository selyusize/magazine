import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";

import { SHOP_MODULE } from "../../../index";
import { RevalidationSchedule } from "../../../service/revalidation-schedule";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { PruneStorefrontRevalidationsCommand } from "../command";
import type { PrunedStorefrontRevalidationsDTO } from "../dto";

const DAY_MS = 24 * 60 * 60 * 1000;
/** За один запуск — не больше, остальное заберёт следующий. */
const BATCH = 5000;

/** Отправленные и окончательно неудачные пачки старше срока хранения. Откат создаёт их заново. */
export const deleteOldStorefrontRevalidationsStep = createStep(
  "delete-old-storefront-revalidations",
  async ({ now }: PruneStorefrontRevalidationsCommand, { container }) => {
    const service = container.resolve<ShopModuleService>(SHOP_MODULE);
    const { keep_days } = Container.from(container).get(RevalidationSchedule).options;
    const rows = await service.listStorefrontRevalidations(
      { status: ["sent", "failed"], created_at: { $lt: new Date(new Date(now).getTime() - keep_days * DAY_MS) } },
      { take: BATCH },
    );
    if (rows.length) await service.deleteStorefrontRevalidations(rows.map((row) => row.id));
    const dto: PrunedStorefrontRevalidationsDTO = { deleted: rows.length };
    return new StepResponse(dto, rows);
  },
  async (rows, { container }) => {
    if (!rows?.length) return;
    await container.resolve<ShopModuleService>(SHOP_MODULE).createStorefrontRevalidations(rows);
  },
);
