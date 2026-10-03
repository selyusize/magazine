import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { EXCHANGE_MODULE } from "../index";
import type { ExchangeModuleService } from "../service/exchange-module-service";

/** Строка таблицы обмена с ключом `supplier_id + external_id`. */
type ExchangeRow = { id: string; supplier_id: string; external_id: string };

/** Методы сервиса модуля для одной таблицы — шаг вызывает только их. */
export type ExchangeRowsRepository<TRow extends ExchangeRow, TData> = {
  list: (filters: { supplier_id: string; external_id: string[] }) => Promise<TRow[]>;
  create: (rows: (TData & { supplier_id: string; external_id: string })[]) => Promise<TRow[]>;
  update: (rows: (TData & { id: string })[]) => Promise<unknown>;
  delete: (ids: string[]) => Promise<void>;
};

export type UpsertedRows = {
  /** id строк по `external_id` — и новых, и существующих. */
  ids: Record<string, string>;
  /** `external_id` созданных и изменённых строк. */
  changed: string[];
  created: number;
  updated: number;
};

/**
 * Фабрика шага «создать или обновить строки поставщика по `external_id`»:
 * - `merge(current, next)` — что писать (`null` — ничего: повторная выгрузка без изменений не пишет в БД);
 * - `snapshot(current)` — те же поля, как они есть сейчас: откат возвращает их и удаляет созданные строки.
 */
export function createUpsertExchangeRowsStep<TInput extends { external_id: string }, TRow extends ExchangeRow, TData>(
  name: string,
  repository: (service: ExchangeModuleService) => ExchangeRowsRepository<TRow, TData>,
  merge: (current: TRow | undefined, next: TInput) => TData | null,
  snapshot: (current: TRow) => TData,
) {
  return createStep(
    name,
    async (input: { supplier_id: string; rows: TInput[] }, { container }) => {
      const rows = repository(container.resolve<ExchangeModuleService>(EXCHANGE_MODULE));
      const result: UpsertedRows = { ids: {}, changed: [], created: 0, updated: 0 };
      const undo: { created: string[]; previous: (TData & { id: string })[] } = { created: [], previous: [] };
      if (!input.rows.length) return new StepResponse(result, undo);

      const existing = await rows.list({
        supplier_id: input.supplier_id,
        external_id: input.rows.map((row) => row.external_id),
      });
      const byExternalId = new Map(existing.map((row) => [row.external_id, row]));

      const toCreate: (TData & { supplier_id: string; external_id: string })[] = [];
      const toUpdate: (TData & { id: string })[] = [];
      for (const next of input.rows) {
        const current = byExternalId.get(next.external_id);
        const data = merge(current, next);
        if (current) result.ids[next.external_id] = current.id;
        if (!data) continue;
        result.changed.push(next.external_id);
        if (!current) {
          toCreate.push({ ...data, supplier_id: input.supplier_id, external_id: next.external_id });
          continue;
        }
        toUpdate.push({ ...data, id: current.id });
        undo.previous.push({ ...snapshot(current), id: current.id });
      }

      if (toCreate.length) {
        const created = await rows.create(toCreate);
        for (const row of created) result.ids[row.external_id] = row.id;
        undo.created = created.map((row) => row.id);
        result.created = created.length;
      }
      if (toUpdate.length) {
        await rows.update(toUpdate);
        result.updated = toUpdate.length;
      }
      return new StepResponse(result, undo);
    },
    async (undo, { container }) => {
      if (!undo) return;
      const rows = repository(container.resolve<ExchangeModuleService>(EXCHANGE_MODULE));
      if (undo.created.length) await rows.delete(undo.created);
      if (undo.previous.length) await rows.update(undo.previous);
    },
  );
}
