import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import type { StalledImportRunDTO } from "./dto";
import type { FindStalledImportRunsQuery } from "./query";

/** Запуски в `queued`/`running`, которые давно не отмечались (событие потерялось, worker упал). Нет — пусто. */
@Injectable()
export class FindStalledImportRunsFetcher extends AbstractFetcher<FindStalledImportRunsQuery, StalledImportRunDTO[]> {
  async fetch(query: FindStalledImportRunsQuery): Promise<StalledImportRunDTO[]> {
    const before = new Date(query.stalled_before);
    const { data } = await this.graph({
      entity: "import_run",
      fields: ["id", "supplier_id"],
      filters: {
        status: ["queued", "running"],
        $or: [{ heartbeat_at: { $lt: before } }, { heartbeat_at: null, updated_at: { $lt: before } }],
      },
    });
    return data.map((run) => ({ id: run.id, supplier_id: run.supplier_id }));
  }
}
