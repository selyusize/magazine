import { Injectable } from "@shared/container";

import { QueueImportRunHandler } from "../../command/queue-import-run/handler";
import { FindLatestImportRunBySupplierIdFetcher } from "../../query/find-latest-import-run-by-supplier-id/fetcher";
import { FindReceivingImportRunBySupplierIdFetcher } from "../../query/find-receiving-import-run-by-supplier-id/fetcher";
import { type ExchangeReply, type ExchangeRequest, ExchangeMode, failure } from "./exchange-mode";

/**
 * `mode=import&filename=…`: первый вызов ставит загруженный пакет в очередь worker, следующие (1С повторяет, пока
 * слышит `progress`) отвечают по статусу запуска: идёт — `progress`, готов — `success`, упал — `failure` с причиной.
 * Пакет обрабатывается целиком (каталог, затем предложения), поэтому вызов на `offers.xml` получает итог всего пакета.
 */
@Injectable()
export class ImportMode extends ExchangeMode {
  readonly mode = "import";

  constructor(
    private readonly receiving: FindReceivingImportRunBySupplierIdFetcher,
    private readonly latest: FindLatestImportRunBySupplierIdFetcher,
    private readonly queue: QueueImportRunHandler,
  ) {
    super();
  }

  async handle(request: ExchangeRequest): Promise<ExchangeReply> {
    const receiving = await this.receiving.fetch({ supplier_id: request.supplier.id });
    if (receiving) {
      await this.queue.handle({ id: receiving.id, from: ["receiving"] });
      return { lines: ["progress"] };
    }

    const run = await this.latest.fetch({ supplier_id: request.supplier.id });
    switch (run?.status) {
      case "queued":
      case "running":
        return { lines: ["progress"] };
      case "done":
        return { lines: ["success"] };
      case "failed":
        return failure(run.message ?? "Импорт не удался");
      default:
        return failure("Нет загруженных файлов: начните обмен заново");
    }
  }
}
