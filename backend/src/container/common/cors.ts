import { define } from "@shared/container";
import { parseOrigins } from "@shared/service/cors/allowed-origins";
import {
  CheckRequestOriginMiddleware,
  type RequestOriginOptions,
} from "@domain/shop/action/check-request-origin/middleware";
import { GetStorefrontOriginsFetcher } from "@domain/shop/query/get-storefront-origins/fetcher";

/**
 * Источники `/store` и `/auth` сверх доменов магазинов: dev-витрина, админка (`/auth` — её вход). Формат Medusa:
 * через запятую, `/…/` — регулярное выражение. Домены витрин берутся из таблицы `shop`.
 */
export const corsConfig: RequestOriginOptions = {
  store: parseOrigins(process.env.STORE_CORS ?? ""),
  auth: parseOrigins(process.env.AUTH_CORS ?? ""),
};

export default [
  define(
    CheckRequestOriginMiddleware,
    ({ get }) =>
      new CheckRequestOriginMiddleware(
        corsConfig,
        get(GetStorefrontOriginsFetcher),
      ),
  ),
];
