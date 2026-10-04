import { z } from "@medusajs/framework/zod";

import { Injectable } from "@shared/container";
import { records, text } from "@shared/query/narrow";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { storefrontOrigins } from "@shared/service/cors/allowed-origins";

import { SHOP_CACHE_TAG, SHOP_CACHE_TTL } from "../../cache";
import type { StorefrontOriginsDTO } from "./dto";
import type { GetStorefrontOriginsQuery } from "./query";

const CachedSchema = z.object({ origins: z.array(z.string()) });

/**
 * Origin витрин из таблицы `shop`: новый магазин или смена домена сбрасывают кэш событием `shop.*`, и CORS
 * пускает домен без рестарта бэкенда. Магазинов десятки — читаем всех одним запросом.
 */
@Injectable()
export class GetStorefrontOriginsFetcher extends AbstractFetcher<
  GetStorefrontOriginsQuery,
  StorefrontOriginsDTO
> {
  async fetch(
    _query: GetStorefrontOriginsQuery,
  ): Promise<StorefrontOriginsDTO> {
    return this.cached(
      "shop-context:storefront-origins",
      SHOP_CACHE_TTL,
      CachedSchema,
      async () => {
        const { data } = await this.graph({
          entity: "shop",
          fields: ["domain", "storefront_url"],
          filters: { is_active: true },
        });
        const origins = records(data).flatMap((row) =>
          storefrontOrigins({
            domain: text(row.domain),
            storefront_url: text(row.storefront_url),
          }),
        );
        return { origins: [...new Set(origins)] };
      },
      [SHOP_CACHE_TAG],
    );
  }
}
