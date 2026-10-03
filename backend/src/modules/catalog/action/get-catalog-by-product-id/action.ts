import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetCatalogByProductIdFetcher } from "../../query/get-catalog-by-product-id/fetcher";

/** GET /admin/products/:id/catalog — бренд, основная и все категории товара. */
@Injectable()
export class GetCatalogByProductIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetCatalogByProductIdFetcher) {}

  async handle(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
  ): Promise<void> {
    const catalog = await this.fetcher.fetch({ product_id: req.params.id });
    res.json({ catalog });
  }
}
