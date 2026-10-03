import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { MapExchangePropertyToAttributeAction } from "@domain/exchange/action/map-exchange-property-to-attribute/action";
import type { MapExchangePropertyToAttributeBody } from "@domain/exchange/action/map-exchange-property-to-attribute/schema";

export const POST = (req: AuthenticatedMedusaRequest<MapExchangePropertyToAttributeBody>, res: MedusaResponse) =>
  Container.from(req.scope).get(MapExchangePropertyToAttributeAction).handle(req, res);
