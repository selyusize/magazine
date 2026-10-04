import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import {
  type AllowedOrigins,
  isAllowedOrigin,
} from "@shared/service/cors/allowed-origins";
import type { Middleware } from "@shared/contract/middleware";

import { GetStorefrontOriginsFetcher } from "../../query/get-storefront-origins/fetcher";

/** Списки из env (`STORE_CORS`, `AUTH_CORS`) — `src/container/common/cors.ts`. */
export type RequestOriginOptions = {
  store: AllowedOrigins["static"];
  auth: AllowedOrigins["static"];
};

/**
 * CORS `/store` и `/auth` по таблице магазинов. Статический CORS Medusa открыт для любого источника
 * (`medusa-config.ts`) — иначе preflight с домена нового магазина отклонялся бы до наших middleware. Здесь
 * запрос из браузера с чужого Origin отклоняется до обработчика (403), поэтому чужой сайт ничего не выполнит
 * от имени покупателя, а ответ без `Access-Control-Allow-Origin` браузер ему не покажет.
 * Запросы без Origin (сервер витрины, curl) — как раньше.
 */
export class CheckRequestOriginMiddleware implements Middleware {
  constructor(
    private readonly options: RequestOriginOptions,
    private readonly fetcher: GetStorefrontOriginsFetcher,
  ) {}

  async handle(
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction,
  ): Promise<void> {
    const origin = req.get("origin");
    if (!origin) return next();

    const { origins } = await this.fetcher.fetch({});
    const namespace = req.originalUrl.startsWith("/auth") ? "auth" : "store";
    if (
      isAllowedOrigin(origin, {
        static: this.options[namespace],
        storefronts: origins,
      })
    )
      return next();

    res.removeHeader("Access-Control-Allow-Origin");
    res.removeHeader("Access-Control-Allow-Credentials");
    throw new MedusaError(
      MedusaError.Types.FORBIDDEN,
      `Источник ${origin} не разрешён для /${namespace}`,
    );
  }
}
