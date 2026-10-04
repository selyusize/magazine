import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";
import { SecretBox } from "@shared/service/crypto/secret-box";
import {
  StorefrontRevalidator,
  type RevalidationResult,
} from "@shared/service/storefront/storefront-revalidator";

import { SHOP_MODULE } from "../../../index";
import type { ShopModuleService } from "../../../service/shop-module-service";

/** Итог отправки; `retryable: false` — повтор не поможет (магазин выключен, секрет не расшифровывается). */
export type PostedRevalidation = RevalidationResult;

/**
 * Вебхук `POST {storefront_url}/api/revalidate` с секретом магазина. Отправку не откатить — отката нет; ошибку
 * не бросает, итог пишет следующий шаг.
 */
export const postStorefrontRevalidationStep = createStep(
  "post-storefront-revalidation",
  async ({ shop_id, tags }: { shop_id: string; tags: string[] }, { container }) => {
    const shop = await container.resolve<ShopModuleService>(SHOP_MODULE).retrieveShop(shop_id);
    if (!shop.is_active) {
      return new StepResponse<PostedRevalidation>({
        ok: false,
        status: null,
        error: "магазин выключен",
        retryable: false,
      });
    }

    const scope = Container.from(container);
    const secret = scope.get(SecretBox).decrypt(shop.revalidate_secret);
    if (!secret) {
      return new StepResponse<PostedRevalidation>({
        ok: false,
        status: null,
        error: "секрет ревалидации не расшифровывается (сменился SHOP_SECRETS_KEY?) — перевыпустите его",
        retryable: false,
      });
    }

    const result = await scope
      .get(StorefrontRevalidator)
      .revalidate({ storefront_url: shop.storefront_url, secret, tags });
    return new StepResponse<PostedRevalidation>(result);
  },
);
