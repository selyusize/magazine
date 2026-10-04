import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { FindShopByCollectionIdFetcher } from "../../query/find-shop-by-collection-id/fetcher";

/** GET /admin/collections/:id/shop — магазин коллекции (сетевой роут); `{ shop: null }` — ещё не выбран. */
@Injectable()
export class GetShopByCollectionIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: FindShopByCollectionIdFetcher) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    res.json({ shop: await this.fetcher.fetch({ collection_id: req.params.id }) });
  }
}
