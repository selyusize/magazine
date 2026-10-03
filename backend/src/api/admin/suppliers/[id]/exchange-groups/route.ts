import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetExchangeGroupsBySupplierIdAction } from "@domain/exchange/action/get-exchange-groups-by-supplier-id/action";

export const GET = (req: AuthenticatedMedusaRequest, res: MedusaResponse) =>
  Container.from(req.scope).get(GetExchangeGroupsBySupplierIdAction).handle(req, res);
