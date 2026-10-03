import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetExchangeGroupsBySupplierIdFetcher } from "../../query/get-exchange-groups-by-supplier-id/fetcher";

/** GET /admin/suppliers/:id/exchange-groups — группы поставщика и их категории (таблица маппинга). */
@Injectable()
export class GetExchangeGroupsBySupplierIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetExchangeGroupsBySupplierIdFetcher) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    res.json({ exchange_groups: await this.fetcher.fetch({ supplier_id: req.params.id }) });
  }
}
