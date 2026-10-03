import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import type { ReceivingImportRunDTO } from "./dto";
import type { FindReceivingImportRunBySupplierIdQuery } from "./query";

/** Последний запуск поставщика в статусе `receiving` (после `mode=init`); нет — `null`. */
@Injectable()
export class FindReceivingImportRunBySupplierIdFetcher extends AbstractFetcher<
  FindReceivingImportRunBySupplierIdQuery,
  ReceivingImportRunDTO | null
> {
  async fetch(query: FindReceivingImportRunBySupplierIdQuery): Promise<ReceivingImportRunDTO | null> {
    const { data } = await this.graph({
      entity: "import_run",
      fields: ["id", "dir"],
      filters: { supplier_id: query.supplier_id, status: "receiving" },
      pagination: { take: 1, order: { created_at: "DESC" } },
    });
    return data[0] ? { id: data[0].id, dir: data[0].dir } : null;
  }
}
