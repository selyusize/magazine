import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import {
  dateOrNull,
  numberOr,
  oneOf,
  recordOf,
  recordOrNull,
  text,
  textOrNull,
  texts,
  toDate,
} from "@shared/query/narrow";

import { parseOr, RunErrorsSchema, RunStatsSchema } from "../../service/exchange-json";
import type { ImportRunDTO } from "./dto";
import type { GetImportRunByIdQuery } from "./query";

export const IMPORT_RUN_FIELDS = [
  "id",
  "supplier_id",
  "supplier.name",
  "source",
  "status",
  "dir",
  "files",
  "only_changes",
  "current_file",
  "cursor",
  "stats",
  "errors",
  "message",
  "started_at",
  "finished_at",
  "heartbeat_at",
  "created_at",
];

export const IMPORT_RUN_SOURCES = ["push", "pull", "manual"] as const;
export const IMPORT_RUN_STATUSES = ["receiving", "queued", "running", "done", "failed"] as const;

export const toImportRunDTO = (value: unknown): ImportRunDTO => {
  const row = recordOf(value);
  return {
    id: text(row.id),
    supplier_id: text(row.supplier_id),
    supplier_name: textOrNull(recordOrNull(row.supplier)?.name),
    source: oneOf(row.source, IMPORT_RUN_SOURCES, "push"),
    status: oneOf(row.status, IMPORT_RUN_STATUSES, "queued"),
    dir: text(row.dir),
    files: texts(row.files),
    only_changes: Boolean(row.only_changes),
    current_file: textOrNull(row.current_file),
    cursor: numberOr(row.cursor),
    stats: parseOr(RunStatsSchema, row.stats, {}),
    errors: parseOr(RunErrorsSchema, row.errors, []),
    message: textOrNull(row.message),
    started_at: dateOrNull(row.started_at),
    finished_at: dateOrNull(row.finished_at),
    heartbeat_at: dateOrNull(row.heartbeat_at),
    created_at: toDate(row.created_at),
  };
};

/** Запуск импорта по id. Нет — NOT_FOUND. */
@Injectable()
export class GetImportRunByIdFetcher extends AbstractFetcher<GetImportRunByIdQuery, ImportRunDTO> {
  async fetch(query: GetImportRunByIdQuery): Promise<ImportRunDTO> {
    const { data } = await this.graph({ entity: "import_run", fields: IMPORT_RUN_FIELDS, filters: { id: query.id } });
    if (!data[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Запуск импорта ${query.id} не найден`);
    return toImportRunDTO(data[0]);
  }
}
