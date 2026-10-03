import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { EXCHANGE_MODULE } from "../../../index";
import type { ExchangeModuleService } from "../../../service/exchange-module-service";
import type { ExchangeContentPlan } from "./plan-exchange-content";

/** Снимок «что записал импорт» и поля под ручным управлением. Откат возвращает прежние. */
export const saveExchangeSnapshotsStep = createStep(
  "save-exchange-snapshots",
  async (snapshots: ExchangeContentPlan["snapshots"], { container }) => {
    if (!snapshots.length) return new StepResponse(undefined, []);
    const exchange = container.resolve<ExchangeModuleService>(EXCHANGE_MODULE);
    const previous = await exchange.listExchangeProducts(
      { id: snapshots.map((snapshot) => snapshot.id) },
      { select: ["id", "imported", "manual_fields"] },
    );
    await exchange.updateExchangeProducts(snapshots);
    return new StepResponse(undefined, previous);
  },
  async (previous, { container }) => {
    if (!previous?.length) return;
    await container.resolve<ExchangeModuleService>(EXCHANGE_MODULE).updateExchangeProducts(previous);
  },
);
