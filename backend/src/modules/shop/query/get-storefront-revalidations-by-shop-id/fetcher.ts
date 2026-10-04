import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { dateOrNull, numberOr, numberOrNull, oneOf, records, text, textOrNull, texts, toDate } from "@shared/query/narrow";

import { STOREFRONT_REVALIDATION_STATUSES } from "../../entity/storefront-revalidation";
import type { StorefrontRevalidationDTO } from "./dto";
import type { GetStorefrontRevalidationsByShopIdQuery } from "./query";

/** Сколько последних отправок показывает админка. */
const JOURNAL_SIZE = 50;

const FIELDS = [
  "id",
  "tags",
  "status",
  "attempts",
  "due_at",
  "sent_at",
  "response_status",
  "error",
  "created_at",
];

const toStorefrontRevalidationDTO = (row: Record<string, unknown>): StorefrontRevalidationDTO => ({
  id: text(row.id),
  tags: texts(row.tags),
  status: oneOf(row.status, STOREFRONT_REVALIDATION_STATUSES, "pending"),
  attempts: numberOr(row.attempts),
  due_at: toDate(row.due_at),
  sent_at: dateOrNull(row.sent_at),
  response_status: numberOrNull(row.response_status),
  error: textOrNull(row.error),
  created_at: toDate(row.created_at),
});

/** GET /admin/storefront-revalidations — последние пачки ревалидации витрины текущего магазина, свежие сверху. */
@Injectable()
export class GetStorefrontRevalidationsByShopIdFetcher extends AbstractFetcher<
  GetStorefrontRevalidationsByShopIdQuery,
  StorefrontRevalidationDTO[]
> {
  async fetch(query: GetStorefrontRevalidationsByShopIdQuery): Promise<StorefrontRevalidationDTO[]> {
    const { data } = await this.graph({
      entity: "storefront_revalidation",
      fields: FIELDS,
      filters: { shop_id: query.shop_id },
      pagination: { take: JOURNAL_SIZE, order: { created_at: "DESC" } },
    });
    return records(data).map(toStorefrontRevalidationDTO);
  }
}
