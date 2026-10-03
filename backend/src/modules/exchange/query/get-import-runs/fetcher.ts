import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { IMPORT_RUN_FIELDS, toImportRunDTO } from "../get-import-run-by-id/fetcher";
import type { ImportRunsPageDTO } from "./dto";
import type { GetImportRunsQuery } from "./query";

/** История импортов: без списка ошибок (он в карточке запуска), пустая — пустой список. */
@Injectable()
export class GetImportRunsFetcher extends AbstractFetcher<GetImportRunsQuery, ImportRunsPageDTO> {
  async fetch(query: GetImportRunsQuery): Promise<ImportRunsPageDTO> {
    const { data, metadata } = await this.graph({
      entity: "import_run",
      fields: IMPORT_RUN_FIELDS.filter((field) => field !== "errors"),
      filters: {
        ...(query.supplier_id ? { supplier_id: query.supplier_id } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      pagination: { skip: query.offset, take: query.limit, order: { created_at: "DESC" } },
    });
    return {
      rows: data.map((row) => {
        const { errors: _errors, ...run } = toImportRunDTO(row);
        return run;
      }),
      count: metadata?.count ?? data.length,
    };
  }
}
