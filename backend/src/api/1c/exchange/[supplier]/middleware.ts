import { type MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework/http";

import { ExchangeWith1CSchema } from "@domain/exchange/action/exchange-with-1c/schema";

/**
 * Протокол 1С: параметры — в query, файл — сырым телом без разбора (части по `file_limit`, пишутся потоком на диск).
 * Авторизация — своя (Basic поставщика или cookie сессии обмена) в Action, не Medusa.
 */
export const exchangeWith1CMiddleware: MiddlewareRoute[] = [
  {
    method: ["GET", "POST"],
    matcher: "/1c/exchange/:supplier",
    bodyParser: false,
    middlewares: [validateAndTransformQuery(ExchangeWith1CSchema, {})],
  },
];
