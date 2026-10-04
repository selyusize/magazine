import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";
import { requireAdminShop } from "@shared/shop/shop-context";

import { GetImportRunsFetcher } from "../../query/get-import-runs/fetcher";
import type { GetImportRunsParams } from "./schema";

type Request = AuthenticatedMedusaRequest<unknown, GetImportRunsParams>;

/** GET /admin/import-runs — история импортов текущего магазина (все его поставщики или один), свежие сверху. */
@Injectable()
export class GetImportRunsAction implements Action<Request> {
  constructor(private readonly fetcher: GetImportRunsFetcher) {}

  async handle(req: Request, res: MedusaResponse): Promise<void> {
    const { supplier_id, status, limit, offset } = req.validatedQuery;
    const { rows, count } = await this.fetcher.fetch({
      shop_id: requireAdminShop(req).id,
      supplier_id,
      status,
      limit,
      offset,
    });
    res.json({ import_runs: rows, count, limit, offset });
  }
}
