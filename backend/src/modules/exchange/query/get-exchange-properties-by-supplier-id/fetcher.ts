import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { recordOf, recordOrNull, textOrNull, textRecord } from "@shared/query/narrow";

import type { ExchangePropertyDTO } from "./dto";
import type { GetExchangePropertiesBySupplierIdQuery } from "./query";

/** Все свойства поставщика по названию — маппинг в админке и разбор товаров при импорте. Нет — пусто. */
@Injectable()
export class GetExchangePropertiesBySupplierIdFetcher extends AbstractFetcher<
  GetExchangePropertiesBySupplierIdQuery,
  ExchangePropertyDTO[]
> {
  async fetch(query: GetExchangePropertiesBySupplierIdQuery): Promise<ExchangePropertyDTO[]> {
    const { data } = await this.graph({
      entity: "exchange_property",
      fields: ["id", "external_id", "name", "values", "attribute_id", "attribute.name"],
      filters: { supplier_id: query.supplier_id },
      pagination: { order: { name: "ASC" } },
    });
    return data.map((row) => ({
      id: row.id,
      external_id: row.external_id,
      name: row.name,
      values: textRecord(row.values),
      attribute_id: row.attribute_id ?? null,
      attribute_name: textOrNull(recordOrNull(recordOf(row).attribute)?.name),
    }));
  }
}
