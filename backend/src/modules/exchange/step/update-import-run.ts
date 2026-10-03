import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { EXCHANGE_MODULE } from "../index";
import type { ExchangeModuleService } from "../service/exchange-module-service";

/** Изменяемые поля запуска; даты — ISO-строкой (вход команды переживает JSON). */
export type ImportRunPatch = {
  status?: "receiving" | "queued" | "running" | "done" | "failed";
  files?: string[];
  only_changes?: boolean;
  current_file?: string | null;
  cursor?: number;
  stats?: Record<string, Record<string, number>>;
  errors?: { external_id: string | null; message: string }[];
  message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  heartbeat_at?: string | null;
};

/** ISO-строка → дата поля; `null` — стереть. */
const toDate = (value: string | null): Date | null => (value === null ? null : new Date(value));

/**
 * Общий шаг команд запуска: меняет поля и возвращает запуск. `from` — менять, только если статус сейчас один из
 * этих (иначе `changed: false`, без записи): так повторный `mode=import` от 1С не ставит запуск в очередь дважды.
 * Откат возвращает прежние значения.
 */
export const updateImportRunStep = createStep(
  "update-import-run",
  async (input: { id: string; patch: ImportRunPatch; from?: ImportRunPatch["status"][] }, { container }) => {
    const exchange = container.resolve<ExchangeModuleService>(EXCHANGE_MODULE);
    const [run] = await exchange.listImportRuns({ id: input.id });
    if (!run) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Запуск импорта ${input.id} не найден`);

    const result = { id: run.id, supplier_id: run.supplier_id, status: run.status, changed: false };
    if (input.from && !input.from.includes(run.status)) return new StepResponse(result, null);

    // Откат пишет все изменяемые поля как были — проще и надёжнее, чем помнить, какие менялись
    const previous = {
      id: run.id,
      status: run.status,
      files: run.files,
      only_changes: run.only_changes,
      current_file: run.current_file,
      cursor: run.cursor,
      stats: run.stats,
      errors: run.errors,
      message: run.message,
      started_at: run.started_at,
      finished_at: run.finished_at,
      heartbeat_at: run.heartbeat_at,
    };
    const { started_at, finished_at, heartbeat_at, ...fields } = input.patch;
    await exchange.updateImportRuns({
      id: run.id,
      ...fields,
      // Не передана — поля нет в обновлении: не трогаем
      ...(started_at === undefined ? {} : { started_at: toDate(started_at) }),
      ...(finished_at === undefined ? {} : { finished_at: toDate(finished_at) }),
      ...(heartbeat_at === undefined ? {} : { heartbeat_at: toDate(heartbeat_at) }),
    });
    return new StepResponse({ ...result, status: input.patch.status ?? run.status, changed: true }, previous);
  },
  async (previous, { container }) => {
    if (!previous) return;
    await container.resolve<ExchangeModuleService>(EXCHANGE_MODULE).updateImportRuns(previous);
  },
);
