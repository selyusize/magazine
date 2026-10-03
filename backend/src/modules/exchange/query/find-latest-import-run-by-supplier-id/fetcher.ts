import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { oneOf } from "@shared/query/narrow";

import { IMPORT_RUN_STATUSES } from "../get-import-run-by-id/fetcher";
import type { LatestImportRunDTO } from "./dto";
import type { FindLatestImportRunBySupplierIdQuery } from "./query";

/** Последний запуск поставщика; запусков нет — `null`. */
@Injectable()
export class FindLatestImportRunBySupplierIdFetcher extends AbstractFetcher<
  FindLatestImportRunBySupplierIdQuery,
  LatestImportRunDTO | null
> {
  async fetch(query: FindLatestImportRunBySupplierIdQuery): Promise<LatestImportRunDTO | null> {
    const { data } = await this.graph({
      entity: "import_run",
      fields: ["id", "status", "message"],
      filters: { supplier_id: query.supplier_id },
      pagination: { take: 1, order: { created_at: "DESC" } },
    });
    const run = data[0];
    return run ? { id: run.id, status: oneOf(run.status, IMPORT_RUN_STATUSES, "queued"), message: run.message ?? null } : null;
  }
}
