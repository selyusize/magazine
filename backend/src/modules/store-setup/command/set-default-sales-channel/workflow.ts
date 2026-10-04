import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  updateStoresWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";

import type { SetDefaultSalesChannelCommand } from "./command";

/**
 * Канал по умолчанию у магазина Medusa (он один на сеть). Пока склады поставщиков не привязаны к каналу своего
 * магазина (план, шаг 3), они берут этот канал — сид ставит сюда канал первого магазина. Откат — у
 * `updateStoresWorkflow`.
 */
export const setDefaultSalesChannelWorkflow = createWorkflow(
  "set-default-sales-channel",
  (command: SetDefaultSalesChannelCommand) => {
    const { data: stores } = useQueryGraphStep({
      entity: "store",
      fields: ["id"],
    });
    updateStoresWorkflow.runAsStep({
      input: transform({ command, stores }, ({ command, stores }) => ({
        selector: { id: stores.map((store) => store.id) },
        update: { default_sales_channel_id: command.sales_channel_id },
      })),
    });
    return new WorkflowResponse(undefined);
  },
);
