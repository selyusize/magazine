import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Container } from "@container/index";
import { GetExchangeReviewBySupplierIdAction } from "@domain/exchange/action/get-exchange-review-by-supplier-id/action";
import type { GetExchangeReviewBySupplierIdParams } from "@domain/exchange/action/get-exchange-review-by-supplier-id/schema";

export const GET = (req: AuthenticatedMedusaRequest<unknown, GetExchangeReviewBySupplierIdParams>, res: MedusaResponse) =>
  Container.from(req.scope).get(GetExchangeReviewBySupplierIdAction).handle(req, res);
