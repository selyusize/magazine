import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { EXCHANGE_MODULE } from "../../../index";
import type { ExchangeModuleService } from "../../../service/exchange-module-service";
import type { PublicationPlan } from "./plan-exchange-publication";

/** Причины очереди «требует разбора». Откат возвращает прежние. */
export const saveExchangeProblemsStep = createStep(
  "save-exchange-problems",
  async (changes: PublicationPlan["problems"], { container }) => {
    if (!changes.length) return new StepResponse(undefined, []);
    const exchange = container.resolve<ExchangeModuleService>(EXCHANGE_MODULE);
    const previous = await exchange.listExchangeProducts(
      { id: changes.map((change) => change.id) },
      { select: ["id", "problems", "needs_review"] },
    );
    await exchange.updateExchangeProducts(changes);
    return new StepResponse(undefined, previous);
  },
  async (previous, { container }) => {
    if (!previous?.length) return;
    await container.resolve<ExchangeModuleService>(EXCHANGE_MODULE).updateExchangeProducts(previous);
  },
);
