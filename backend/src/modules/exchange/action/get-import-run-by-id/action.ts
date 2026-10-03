import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { GetImportRunByIdFetcher } from "../../query/get-import-run-by-id/fetcher";

/** GET /admin/import-runs/:id — запуск с ходом, счётчиками и ошибками. */
@Injectable()
export class GetImportRunByIdAction implements Action<AuthenticatedMedusaRequest> {
  constructor(private readonly fetcher: GetImportRunByIdFetcher) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    res.json({ import_run: await this.fetcher.fetch({ id: req.params.id }) });
  }
}
