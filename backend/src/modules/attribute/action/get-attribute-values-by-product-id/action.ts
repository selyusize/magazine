import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetAttributeValuesByProductIdFetcher } from "../../query/get-attribute-values-by-product-id/fetcher";

/** GET /admin/products/:id/attributes — характеристики товара и его вариантов. */
@Injectable()
export class GetAttributeValuesByProductIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetAttributeValuesByProductIdFetcher) {}

  async handle(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
  ): Promise<void> {
    const attribute_values = await this.fetcher.fetch({
      product_id: req.params.id,
    });
    res.json({ attribute_values });
  }
}
