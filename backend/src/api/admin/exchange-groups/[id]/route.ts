import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { MapExchangeGroupToCategoryAction } from "@domain/exchange/action/map-exchange-group-to-category/action";
import type { MapExchangeGroupToCategoryBody } from "@domain/exchange/action/map-exchange-group-to-category/schema";

export const POST = (req: AuthenticatedMedusaRequest<MapExchangeGroupToCategoryBody>, res: MedusaResponse) =>
  Container.from(req.scope).get(MapExchangeGroupToCategoryAction).handle(req, res);
