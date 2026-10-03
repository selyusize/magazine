import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetExchangePropertiesBySupplierIdAction } from "@domain/exchange/action/get-exchange-properties-by-supplier-id/action";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetExchangePropertiesBySupplierIdAction).handle(req, res);
