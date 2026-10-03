import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { EXCHANGE_MODULE } from "../../../index";
import type { ExchangeModuleService } from "../../../service/exchange-module-service";

/** Товар поставщика → его карточка (новая — владелец, склеенная — нет). Откат снимает связь. */
export const linkExchangeProductsStep = createStep(
  "link-exchange-products",
  async (links: { row_id: string; product_id: string; is_owner: boolean }[], { container }) => {
    if (!links.length) return new StepResponse(undefined, []);
    const exchange = container.resolve<ExchangeModuleService>(EXCHANGE_MODULE);
    await exchange.updateExchangeProducts(
      links.map((link) => ({ id: link.row_id, product_id: link.product_id, is_owner: link.is_owner })),
    );
    return new StepResponse(
      undefined,
      links.map((link) => link.row_id),
    );
  },
  async (rowIds, { container }) => {
    if (!rowIds?.length) return;
    await container
      .resolve<ExchangeModuleService>(EXCHANGE_MODULE)
      .updateExchangeProducts(rowIds.map((id) => ({ id, product_id: null, is_owner: false })));
  },
);
