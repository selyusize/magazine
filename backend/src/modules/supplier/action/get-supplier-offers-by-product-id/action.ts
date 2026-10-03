import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetSupplierOffersByProductIdFetcher } from "../../query/get-supplier-offers-by-product-id/fetcher";

/** GET /admin/products/:id/supplier-offers — предложения поставщиков по всем вариантам товара. */
@Injectable()
export class GetSupplierOffersByProductIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetSupplierOffersByProductIdFetcher) {}

  async handle(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
  ): Promise<void> {
    const supplier_offers = await this.fetcher.fetch({
      product_id: req.params.id,
    });
    res.json({ supplier_offers });
  }
}
