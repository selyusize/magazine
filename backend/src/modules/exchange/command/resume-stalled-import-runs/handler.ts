import { Injectable } from "@shared/container";
import type { CommandHandler } from "@shared/contract/command-handler";

import { FindStalledImportRunsFetcher } from "../../query/find-stalled-import-runs/fetcher";
import { ExchangeConfig } from "../../service/exchange-config";
import { QueueImportRunHandler } from "../queue-import-run/handler";
import type { ResumeStalledImportRunsCommand } from "./command";

/**
 * Запуск ждёт или «молчит» дольше `stalled_after_minutes` — событие потерялось или worker упал: снова в очередь.
 * Обработчик продолжит с сохранённой позиции; живой запуск того же поставщика удержит блокировку, и повтор выйдет.
 */
@Injectable()
export class ResumeStalledImportRunsHandler implements CommandHandler<ResumeStalledImportRunsCommand, void> {
  constructor(
    private readonly stalled: FindStalledImportRunsFetcher,
    private readonly queue: QueueImportRunHandler,
    private readonly config: ExchangeConfig,
  ) {}

  async handle(command: ResumeStalledImportRunsCommand): Promise<void> {
    const before = new Date(new Date(command.now).getTime() - this.config.options.stalled_after_minutes * 60_000);
    for (const run of await this.stalled.fetch({ stalled_before: before.toISOString() }))
      await this.queue.handle({ id: run.id, from: ["queued", "running"] });
  }
}
