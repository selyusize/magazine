import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { AssignShopToCollectionsHandler } from "../../command/assign-shop-to-collections/handler";
import { FindShopByCollectionIdFetcher } from "../../query/find-shop-by-collection-id/fetcher";
import type { AssignShopToCollectionBody } from "./schema";

/**
 * POST /admin/collections/:id/shop — выбрать магазин коллекции из дашборда Medusa (один раз: магазин не меняется,
 * другой — 400). Ответ — магазин коллекции.
 */
@Injectable()
export class AssignShopToCollectionAction implements Action<AuthenticatedMedusaRequest<AssignShopToCollectionBody>> {
  constructor(
    private readonly handler: AssignShopToCollectionsHandler,
    private readonly fetcher: FindShopByCollectionIdFetcher,
  ) {}

  async handle(req: AuthenticatedMedusaRequest<AssignShopToCollectionBody>, res: MedusaResponse): Promise<void> {
    await this.handler.handle({ collection_ids: [req.params.id], shop: { id: req.validatedBody.shop_id } });
    res.json({ shop: await this.fetcher.fetch({ collection_id: req.params.id }) });
  }
}
