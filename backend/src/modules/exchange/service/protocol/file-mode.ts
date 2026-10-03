import { Injectable } from "@shared/container";
import { PackageStorage } from "@shared/service/package-storage/package-storage";

import { StartImportRunHandler } from "../../command/start-import-run/handler";
import { FindReceivingImportRunBySupplierIdFetcher } from "../../query/find-receiving-import-run-by-supplier-id/fetcher";
import { ExchangeConfig } from "../exchange-config";
import { type ExchangeReply, type ExchangeRequest, ExchangeMode, failure } from "./exchange-mode";

/**
 * `mode=file&filename=…`: файл (или его очередная часть) дописывается в папку текущего запуска. Сеанса без `init`
 * (так делают некоторые обработки) — запуск заводится сам.
 */
@Injectable()
export class FileMode extends ExchangeMode {
  readonly mode = "file";

  constructor(
    private readonly receiving: FindReceivingImportRunBySupplierIdFetcher,
    private readonly start: StartImportRunHandler,
    private readonly storage: PackageStorage,
    private readonly config: ExchangeConfig,
  ) {
    super();
  }

  async handle(request: ExchangeRequest): Promise<ExchangeReply> {
    if (!request.filename) return failure("Не передано имя файла (filename)", 400);
    const run =
      (await this.receiving.fetch({ supplier_id: request.supplier.id })) ??
      (await this.start.handle({ supplier_id: request.supplier.id, source: "push", status: "receiving" }));
    await this.storage.append(run.dir, request.filename, request.body, this.config.options.file_limit);
    return { lines: ["success"] };
  }
}
