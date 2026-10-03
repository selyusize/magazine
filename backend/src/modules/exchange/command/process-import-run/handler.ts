import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import type { CommandHandler } from "@shared/contract/command-handler";
import { type FileLogger, Logger } from "@shared/service/logger/logger";

import { ZeroStaleOffersForSupplierHandler } from "@domain/supplier/command/zero-stale-offers-for-supplier/handler";

import { GetExchangeSupplierByIdFetcher } from "../../query/get-exchange-supplier-by-id/fetcher";
import type { ImportRunDTO } from "../../query/get-import-run-by-id/dto";
import { GetImportRunByIdFetcher } from "../../query/get-import-run-by-id/fetcher";
import { CatalogImporter } from "../../service/catalog-importer";
import { readCommerceML } from "../../service/commerceml/reader";
import { ExchangeConfig } from "../../service/exchange-config";
import { ExchangePackage } from "../../service/exchange-package";
import type { ImportContext } from "../../service/import-context";
import { ImportRunProgress } from "../../service/import-run-progress";
import { OffersImporter } from "../../service/offers-importer";
import { batchRecords } from "../../service/record-batches";
import { SupplierImportLock } from "../../service/supplier-import-lock";
import type { ImportRunPatch } from "../../step/update-import-run";
import { FinishImportRunHandler } from "../finish-import-run/handler";
import { SaveImportRunProgressHandler } from "../save-import-run-progress/handler";
import type { ProcessImportRunCommand } from "./command";
import { errorMessage } from "@shared/service/error/error-message";

/**
 * Обработка запуска импорта (worker): пакет → файлы по порядку → пачки → команды записи (каждая — workflow с
 * откатом). Сам ничего не пишет, поэтому без workflow: он долгий (часы на больших каталогах) и продолжается после
 * падения с сохранённой позиции, а каждая пачка — отдельная транзакция.
 *
 * Повтор события безопасен: запуск не в `queued`/`running` не обрабатывается, второй запуск того же поставщика ждёт
 * блокировку (его подхватит job `exchange-resume-import-runs`).
 */
@Injectable()
export class ProcessImportRunHandler implements CommandHandler<ProcessImportRunCommand, void> {
  constructor(
    private readonly runs: GetImportRunByIdFetcher,
    private readonly suppliers: GetExchangeSupplierByIdFetcher,
    private readonly files: ExchangePackage,
    private readonly lock: SupplierImportLock,
    private readonly config: ExchangeConfig,
    private readonly logger: Logger,
    private readonly catalog: CatalogImporter,
    private readonly offers: OffersImporter,
    private readonly progress: SaveImportRunProgressHandler,
    private readonly finish: FinishImportRunHandler,
    private readonly stale: ZeroStaleOffersForSupplierHandler,
  ) {}

  async handle({ id }: ProcessImportRunCommand): Promise<void> {
    const run = await this.runs.fetch({ id });
    if (run.status !== "queued" && run.status !== "running") return;
    if (!(await this.lock.acquire(run.supplier_id, run.id, this.lockSeconds()))) return;

    const log = this.logger.toFile(`import-${run.supplier_id}`);
    try {
      await this.process(run, log);
      await this.finish.handle({ id, status: "done", message: null });
    } catch (error) {
      // Пакет не разобран (битый XML или архив, нет файлов): запуск — failed с причиной, его можно повторить
      const message = errorMessage(error);
      log.error(`exchange/process-import-run: запуск ${id} упал: ${message}`, error);
      await this.finish.handle({ id, status: "failed", message });
    } finally {
      await this.lock.release(run.supplier_id, run.id);
      await log.flush();
    }
  }

  private async process(run: ImportRunDTO, log: FileLogger): Promise<void> {
    const supplier = await this.suppliers.fetch({ supplier_id: run.supplier_id });
    const files = await this.files.prepare(run.dir);
    if (!files.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "В пакете нет XML-файлов");

    const context: ImportContext = {
      run_id: run.id,
      supplier_id: run.supplier_id,
      package_dir: run.dir,
      synced_at: (run.started_at ?? new Date()).toISOString(),
      settings: supplier.settings,
      price_types: [],
      properties: new Map(),
      groups: new Map(),
      progress: new ImportRunProgress(run),
      log,
    };
    await this.catalog.loadMappings(context);
    await this.save(context, { status: "running", files, started_at: context.synced_at });
    log.info(`exchange/process-import-run: запуск ${run.id}, «${supplier.name}», файлы: ${files.join(", ")}`);

    let onlyChanges = run.only_changes;
    for (const file of files) {
      const skip = context.progress.resumeFrom(file, files);
      if (skip === "skip") continue;
      context.progress.at(file, skip);
      onlyChanges = (await this.importFile(context, file, skip)) || onlyChanges;
      await this.save(context, { only_changes: onlyChanges });
    }

    if (!onlyChanges && context.progress.hasOffers()) {
      const stale = await this.stale.handle({ supplier_id: run.supplier_id, synced_before: context.synced_at });
      context.progress.count("offers", "zeroed", stale.count);
      log.info(`exchange/process-import-run: нет в полной выгрузке — остаток 0 у ${stale.count} предложений`);
      await this.save(context, {});
    }
    log.info(`exchange/process-import-run: запуск ${run.id} готов`, context.progress.snapshot().stats);
  }

  /** Файл пачками; возвращает, помечен ли он «только изменения». */
  private async importFile(context: ImportContext, file: string, skip: number): Promise<boolean> {
    let onlyChanges = false;
    const records = readCommerceML(this.files.open(context.package_dir, file));
    for await (const batch of batchRecords(records, { batch_size: this.config.options.batch_size, skip })) {
      switch (batch.kind) {
        case "classifier":
          await this.catalog.saveClassifier(context, batch.groups, batch.properties);
          break;
        case "price_types":
          context.price_types = batch.price_types;
          break;
        case "package":
          onlyChanges ||= batch.only_changes;
          break;
        case "invalid":
          context.progress.fail(null, `${file}: ${batch.message}`);
          break;
        case "products":
          await this.catalog.importProducts(context, batch.products);
          await this.checkpoint(context, file, batch.position);
          break;
        case "offers":
          await this.offers.importOffers(context, batch.offers);
          await this.checkpoint(context, file, batch.position);
          break;
      }
    }
    return onlyChanges;
  }

  /** После пачки: позиция и счётчики в запуск, отметка «жив», продление блокировки поставщика. */
  private async checkpoint(context: ImportContext, file: string, position: number): Promise<void> {
    context.progress.at(file, position);
    await this.save(context, {});
    if (!(await this.lock.acquire(context.supplier_id, context.run_id, this.lockSeconds())))
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Блокировка поставщика потеряна: импорт продолжил другой запуск",
      );
  }

  private async save(context: ImportContext, patch: Omit<ImportRunPatch, "finished_at">): Promise<void> {
    await this.progress.handle({
      id: context.run_id,
      patch: { ...context.progress.snapshot(), ...patch, heartbeat_at: new Date().toISOString() },
    });
  }

  private lockSeconds(): number {
    return this.config.options.stalled_after_minutes * 60;
  }
}
