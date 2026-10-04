import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";
import { generateSecret, SecretBox } from "@shared/service/crypto/secret-box";
import { revalidateURL } from "@shared/service/storefront/storefront-revalidator";

import { SHOP_MODULE } from "../../../index";
import type { ShopModuleService } from "../../../service/shop-module-service";
import type { RegenerateRevalidateSecretForShopCommand } from "../command";
import type { RegeneratedRevalidateSecretDTO } from "../dto";

/** Новый секрет магазина (в БД — зашифрованный); откат возвращает прежнюю запись. */
export const replaceRevalidateSecretStep = createStep(
  "replace-revalidate-secret",
  async ({ shop_id }: RegenerateRevalidateSecretForShopCommand, { container }) => {
    const shops = container.resolve<ShopModuleService>(SHOP_MODULE);
    const shop = await shops.retrieveShop(shop_id);
    const secret = generateSecret();
    await shops.updateShops({
      id: shop_id,
      revalidate_secret: Container.from(container).get(SecretBox).encrypt(secret),
    });
    const dto: RegeneratedRevalidateSecretDTO = {
      revalidate_url: revalidateURL(shop.storefront_url),
      revalidate_secret: secret,
    };
    return new StepResponse(dto, { id: shop_id, revalidate_secret: shop.revalidate_secret });
  },
  async (previous, { container }) => {
    if (!previous) return;
    await container.resolve<ShopModuleService>(SHOP_MODULE).updateShops(previous);
  },
);
