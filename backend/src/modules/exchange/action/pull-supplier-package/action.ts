import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { PullSupplierPackageHandler } from "../../command/pull-supplier-package/handler";
import { GetImportRunByIdFetcher } from "../../query/get-import-run-by-id/fetcher";

/** POST /admin/suppliers/:id/import-runs — ручной запуск: скачать выгрузку поставщика сейчас (pull). */
@Injectable()
export class PullSupplierPackageAction implements Action<AuthenticatedMedusaRequest> {
  constructor(
    private readonly handler: PullSupplierPackageHandler,
    private readonly fetcher: GetImportRunByIdFetcher,
  ) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    const run = await this.handler.handle({ supplier_id: req.params.id, source: "manual" });
    res.status(202).json({ import_run: await this.fetcher.fetch({ id: run.id }) });
  }
}
