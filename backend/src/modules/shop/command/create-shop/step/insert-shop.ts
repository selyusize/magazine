import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SHOP_MODULE } from "../../../index";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { CreateShopCommand } from "../command";

/** Запись магазина; откат удаляет её насовсем — магазин ещё никто не видел. */
export const insertShopStep = createStep(
  "insert-shop",
  async (
    input: CreateShopCommand & { root_category_id: string },
    { container },
  ) => {
    const shops = container.resolve<ShopModuleService>(SHOP_MODULE);
    const shop = await shops.createShops(input);
    return new StepResponse({ id: shop.id }, shop.id);
  },
  async (shopId, { container }) => {
    if (!shopId) return;
    await container.resolve<ShopModuleService>(SHOP_MODULE).deleteShops(shopId);
  },
);
