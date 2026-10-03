import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetExchangeReviewBySupplierIdFetcher } from "../../query/get-exchange-review-by-supplier-id/fetcher";
import type { GetExchangeReviewBySupplierIdParams } from "./schema";

type Request = AuthenticatedMedusaRequest<unknown, GetExchangeReviewBySupplierIdParams>;

/** GET /admin/suppliers/:id/exchange-review — очередь «требует разбора» поставщика. */
@Injectable()
export class GetExchangeReviewBySupplierIdAction implements Action<Request> {
  constructor(private readonly fetcher: GetExchangeReviewBySupplierIdFetcher) {}

  async handle(req: Request, res: MedusaResponse): Promise<void> {
    const { limit, offset } = req.validatedQuery;
    const review = await this.fetcher.fetch({ supplier_id: req.params.id, limit, offset });
    res.json({ ...review, limit, offset });
  }
}
