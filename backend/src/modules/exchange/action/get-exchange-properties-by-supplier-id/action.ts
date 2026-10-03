import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetExchangePropertiesBySupplierIdFetcher } from "../../query/get-exchange-properties-by-supplier-id/fetcher";

/** GET /admin/suppliers/:id/exchange-properties — свойства поставщика и их характеристики (маппинг). */
@Injectable()
export class GetExchangePropertiesBySupplierIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetExchangePropertiesBySupplierIdFetcher) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    res.json({ exchange_properties: await this.fetcher.fetch({ supplier_id: req.params.id }) });
  }
}
