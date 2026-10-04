import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetStorefrontRevalidationsByShopIdAction } from "@domain/shop/action/get-storefront-revalidations-by-shop-id/action";
import { RevalidateStorefrontForShopAction } from "@domain/shop/action/revalidate-storefront-for-shop/action";

/** Журнал вебхуков ревалидации витрины текущего магазина (`x-shop-id`, без него — 400). */
export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetStorefrontRevalidationsByShopIdAction).handle(req, res);

/** «Обновить витрину целиком» — все групповые теги текущего магазина в очередь. */
export const POST = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(RevalidateStorefrontForShopAction).handle(req, res);
