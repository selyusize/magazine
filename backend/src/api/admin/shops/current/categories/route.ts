import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetCategoriesByShopIdAction } from "@domain/catalog/action/get-categories-by-shop-id/action";

/** Категории текущего магазина (`x-shop-id`, без него — 400). */
export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetCategoriesByShopIdAction).handle(req, res);
