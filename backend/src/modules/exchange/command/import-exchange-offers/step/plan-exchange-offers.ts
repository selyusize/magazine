import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { type OffersImportState, planOffersImport } from "../../../service/offers-import-plan";
import type { ImportExchangeOffersCommand } from "../command";

/** Без чтения и записи: план пачки по загруженному состоянию (`planOffersImport`). */
export const planExchangeOffersStep = createStep(
  "plan-exchange-offers",
  async (input: { command: ImportExchangeOffersCommand; state: OffersImportState }) =>
    new StepResponse(
      planOffersImport({
        offers: input.command.offers,
        settings: input.command.settings,
        price_types: input.command.price_types,
        state: input.state,
      }),
    ),
);
