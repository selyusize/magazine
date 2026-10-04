import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { recordOf, recordOrNull, text, textOrNull } from "@shared/query/narrow";

/** Магазин поставщика глазами импорта: куда класть товары, бренды и характеристики из его выгрузки. */
export type SupplierShop = {
  shop_id: string;
  sales_channel_id: string;
};

/**
 * Только чтение: магазин поставщика и его канал продаж. Магазин — функция поставщика (`supplier.shop_id` не
 * меняется), поэтому команды импорта его не передают, а шаги берут отсюда.
 */
export const findSupplierShopStep = createStep(
  "find-supplier-shop",
  async (input: { supplier_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data } = await query.graph({
      entity: "supplier",
      fields: ["id", "shop_id", "shop.sales_channel.id"],
      filters: { id: input.supplier_id },
    });
    const supplier = recordOf(data[0]);
    const salesChannelId = textOrNull(recordOrNull(recordOrNull(supplier.shop)?.sales_channel)?.id);
    if (!salesChannelId)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Поставщик ${input.supplier_id}: нет магазина или канала продаж магазина — импорту некуда класть товары`,
      );
    return new StepResponse<SupplierShop>({ shop_id: text(supplier.shop_id), sales_channel_id: salesChannelId });
  },
);
