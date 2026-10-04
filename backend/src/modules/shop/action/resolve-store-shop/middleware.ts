import type {
  MedusaNextFunction,
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { Middleware } from "@shared/contract/middleware";

import { FindShopContextFetcher } from "../../query/find-shop-context/fetcher";

/**
 * Store API: publishable-ключ → магазин → `req.shop`. Ключ уже проверила Medusa (`publishable_key_context`);
 * ключ без магазина или выключенный магазин — 403: витрина не должна видеть чужой или закрытый каталог.
 */
@Injectable()
export class ResolveStoreShopMiddleware implements Middleware<MedusaStoreRequest> {
  constructor(private readonly fetcher: FindShopContextFetcher) {}

  async handle(
    req: MedusaStoreRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction,
  ): Promise<void> {
    // Роуты без ключа (Medusa его не потребовала) магазина не имеют
    const publishableKey = req.publishable_key_context?.key;
    if (!publishableKey) return next();

    const shop = await this.fetcher.fetch({ publishable_key: publishableKey });
    if (!shop)
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "Ключ витрины не привязан к магазину",
      );
    if (!shop.is_active)
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        `Магазин ${shop.slug} выключен`,
      );

    req.shop = shop;
    next();
  }
}
