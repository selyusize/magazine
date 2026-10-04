import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";
import { generateSecret, SecretBox } from "@shared/service/crypto/secret-box";

import { SHOP_MODULE } from "../../../index";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { CreateShopCommand } from "../command";

/** Запись магазина с зашифрованным секретом ревалидации; откат удаляет её насовсем — магазин ещё никто не видел. */
export const insertShopStep = createStep(
  "insert-shop",
  async (
    input: CreateShopCommand & { root_category_id: string },
    { container },
  ) => {
    const shops = container.resolve<ShopModuleService>(SHOP_MODULE);
    const { revalidate_secret, ...data } = input;
    const shop = await shops.createShops({
      ...data,
      revalidate_secret: Container.from(container)
        .get(SecretBox)
        .encrypt(revalidate_secret || generateSecret()),
    });
    return new StepResponse({ id: shop.id }, shop.id);
  },
  async (shopId, { container }) => {
    if (!shopId) return;
    await container.resolve<ShopModuleService>(SHOP_MODULE).deleteShops(shopId);
  },
);
