import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { Action } from "@shared/contract/action";

import { QueueImportRunHandler } from "../../command/queue-import-run/handler";
import { GetImportRunByIdFetcher } from "../../query/get-import-run-by-id/fetcher";

/** POST /admin/import-runs/:id/retry — упавший запуск снова в очередь, с места остановки. */
@Injectable()
export class RetryImportRunAction implements Action<AuthenticatedMedusaRequest> {
  constructor(
    private readonly queue: QueueImportRunHandler,
    private readonly fetcher: GetImportRunByIdFetcher,
  ) {}

  async handle(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
    const queued = await this.queue.handle({ id: req.params.id, from: ["failed"] });
    if (!queued.queued)
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Повторить можно только упавший запуск импорта");
    res.status(202).json({ import_run: await this.fetcher.fetch({ id: req.params.id }) });
  }
}
