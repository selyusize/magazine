import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { CommandHandler } from "@shared/contract/command-handler";
import { Downloader } from "@shared/service/download/downloader";
import { PackageStorage } from "@shared/service/package-storage/package-storage";

import { GetExchangeSupplierByIdFetcher } from "../../query/get-exchange-supplier-by-id/fetcher";
import { FinishImportRunHandler } from "../finish-import-run/handler";
import { QueueImportRunHandler } from "../queue-import-run/handler";
import { StartImportRunHandler } from "../start-import-run/handler";
import type { PullSupplierPackageCommand } from "./command";
import type { PulledSupplierPackageDTO } from "./dto";
import { errorMessage } from "@shared/service/error/error-message";

/** Имя скачанного файла: номер (порядок ссылок — порядок разбора) и безопасное имя из адреса. */
export function downloadedFileName(url: string, index: number): string {
  const base = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "").replace(/[^\w.-]+/g, "_");
  return `${String(index + 1).padStart(2, "0")}-${base || "package.xml"}`;
}

/**
 * Pull: новый запуск → файлы по ссылкам поставщика в его папку → очередь worker. Сам в БД не пишет — только
 * команды запуска. Не скачалось — запуск `failed` с причиной (видно в истории импортов), а не потерянная ошибка job.
 */
@Injectable()
export class PullSupplierPackageHandler implements CommandHandler<PullSupplierPackageCommand, PulledSupplierPackageDTO> {
  constructor(
    private readonly suppliers: GetExchangeSupplierByIdFetcher,
    private readonly start: StartImportRunHandler,
    private readonly queue: QueueImportRunHandler,
    private readonly finish: FinishImportRunHandler,
    private readonly downloader: Downloader,
    private readonly storage: PackageStorage,
  ) {}

  async handle(command: PullSupplierPackageCommand): Promise<PulledSupplierPackageDTO> {
    const { settings } = await this.suppliers.fetch({ supplier_id: command.supplier_id });
    if (settings.mode !== "pull" || !settings.urls.length)
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "У поставщика не настроена загрузка выгрузки по ссылке");

    const run = await this.start.handle({ supplier_id: command.supplier_id, source: command.source, status: "receiving" });
    try {
      for (const [index, url] of settings.urls.entries())
        await this.downloader.toFile(
          { url, login: settings.url_login, password: settings.url_password },
          this.storage.resolve(run.dir, downloadedFileName(url, index)),
        );
    } catch (error) {
      await this.finish.handle({ id: run.id, status: "failed", message: errorMessage(error) });
      return { id: run.id, status: "failed" };
    }
    await this.queue.handle({ id: run.id, from: ["receiving"] });
    return { id: run.id, status: "queued" };
  }
}
