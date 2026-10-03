import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { recordOf, recordOrNull, text, textOrNull, texts } from "@shared/query/narrow";

import type { ExchangeReviewDTO } from "./dto";
import type { GetExchangeReviewBySupplierIdQuery } from "./query";

/** Товары поставщика с причинами разбора (нет категории, фото, цены) и число групп без категории. Пусто — пусто. */
@Injectable()
export class GetExchangeReviewBySupplierIdFetcher extends AbstractFetcher<
  GetExchangeReviewBySupplierIdQuery,
  ExchangeReviewDTO
> {
  async fetch(query: GetExchangeReviewBySupplierIdQuery): Promise<ExchangeReviewDTO> {
    const [{ data, metadata }, { metadata: groups }] = await Promise.all([
      this.graph({
        entity: "exchange_product",
        fields: ["external_id", "product_id", "data", "problems", "product.title", "product.status"],
        filters: { supplier_id: query.supplier_id, needs_review: true },
        pagination: { skip: query.offset, take: query.limit, order: { updated_at: "DESC" } },
      }),
      this.graph({
        entity: "exchange_group",
        fields: ["id"],
        filters: { supplier_id: query.supplier_id, category_id: null },
        pagination: { skip: 0, take: 1 },
      }),
    ]);
    return {
      products: data.map((value) => {
        const row = recordOf(value);
        const product = recordOrNull(row.product);
        const externalId = text(row.external_id);
        return {
          external_id: externalId,
          product_id: textOrNull(row.product_id),
          title: textOrNull(product?.title) ?? textOrNull(recordOf(row.data).title) ?? externalId,
          status: textOrNull(product?.status),
          problems: texts(row.problems),
        };
      }),
      count: metadata?.count ?? data.length,
      unmapped_groups: groups?.count ?? 0,
    };
  }
}
