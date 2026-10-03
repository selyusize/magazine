import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { recordOf, recordOrNull, textOrNull } from "@shared/query/narrow";

import type { ExchangeGroupDTO } from "./dto";
import type { GetExchangeGroupsBySupplierIdQuery } from "./query";

/** Дерево групп поставщика плоским списком (родитель — `parent_external_id`) для таблицы маппинга. Нет — пусто. */
@Injectable()
export class GetExchangeGroupsBySupplierIdFetcher extends AbstractFetcher<
  GetExchangeGroupsBySupplierIdQuery,
  ExchangeGroupDTO[]
> {
  async fetch(query: GetExchangeGroupsBySupplierIdQuery): Promise<ExchangeGroupDTO[]> {
    const { data } = await this.graph({
      entity: "exchange_group",
      fields: ["id", "external_id", "parent_external_id", "name", "category_id", "product_category.name"],
      filters: { supplier_id: query.supplier_id },
      pagination: { order: { name: "ASC" } },
    });
    return data.map((row) => ({
      id: row.id,
      external_id: row.external_id,
      parent_external_id: row.parent_external_id ?? null,
      name: row.name,
      category_id: row.category_id ?? null,
      category_name: textOrNull(recordOrNull(recordOf(row).product_category)?.name),
    }));
  }
}
