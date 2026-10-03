import type {
  RemoteQueryFunction,
  SearchTypes,
} from "@medusajs/framework/types";

import { isString, recordOrNull, records } from "@shared/query/narrow";

const RESOLVE_BATCH_SIZE = 200;

/** Из контекста индексации нужен только Query: `SearchTypes.SearchIngestionContext` подходит. */
type ResolveContext = { container: { query: Pick<RemoteQueryFunction, "graph" | "search"> } };

/** A row read back from `query.graph`: only the path to the product ids matters. */
type Row = Record<string, unknown>;

type RelatedEntity = {
  entity: string;
  fields: string[];
  pick: (row: Row) => unknown[];
};

const idsOf = (items: unknown): unknown[] => records(items).map((item) => item.id);

/**
 * Since Medusa 2.16 options are shared between products (`product_option.products`,
 * many-to-many): an option has no `product_id`, and one option leads to many products.
 */
const RELATED_ENTITIES: Record<string, RelatedEntity> = {
  "product-variant": {
    entity: "product_variant",
    fields: ["product_id"],
    pick: (row) => [row.product_id],
  },
  "product-option": {
    entity: "product_option",
    fields: ["products.id"],
    pick: (row) => idsOf(row.products),
  },
  "product-option-value": {
    entity: "product_option_value",
    fields: ["option.products.id"],
    pick: (row) => idsOf(recordOrNull(row.option)?.products),
  },
  "product-tag": {
    entity: "product_tag",
    fields: ["products.id"],
    pick: (row) => idsOf(row.products),
  },
  "product-category": {
    entity: "product_category",
    fields: ["products.id"],
    pick: (row) => idsOf(row.products),
  },
};

// Core emits either a single `{ id }` or a batch of them.
function payloadIds(data: unknown): string[] {
  return records(Array.isArray(data) ? data : [data])
    .map((entry) => entry.id)
    .filter((id): id is string => isString(id) && id.length > 0);
}

/**
 * The products behind rows of another entity, read through `query.graph`.
 * Deleted rows are soft-deleted, so they're still readable with `withDeleted`,
 * which is how a deleted variant or category still leads back to its products.
 */
async function relatedProductIds(
  query: Pick<RemoteQueryFunction, "graph" | "search">,
  { entity, fields, pick }: RelatedEntity,
  ids: string[],
  withDeleted: boolean,
): Promise<string[]> {
  const { data } = await query.graph({
    entity,
    fields,
    filters: { id: ids },
    withDeleted,
  });

  const productIds = records(data)
    .flatMap(pick)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  return Array.from(new Set(productIds));
}

/**
 * Deleting a sales channel removes its product links, so the products can no
 * longer be found through `query.graph`. The index still holds the channel on
 * each document, which is what's searched here.
 */
async function productIdsInSalesChannels(
  query: Pick<RemoteQueryFunction, "graph" | "search">,
  salesChannelIds: string[],
): Promise<string[]> {
  const ids: string[] = [];
  let skip = 0;

  while (true) {
    const { search_result: result } = await query.search({
      entity: "product",
      fields: ["id"],
      filters: { sales_channel_ids: salesChannelIds },
      pagination: { skip, take: RESOLVE_BATCH_SIZE },
    });

    ids.push(...result.hits.map((hit) => hit.id));

    if (result.hits.length < RESOLVE_BATCH_SIZE) {
      return ids;
    }

    skip += RESOLVE_BATCH_SIZE;
  }
}

/**
 * The products an event affects. A product event carries them directly; an
 * event about a variant, option, tag, category or sales channel is mapped to
 * the products behind it.
 */
export async function resolveProductIds(
  event: { name: string; data: unknown },
  { container: { query } }: ResolveContext,
): Promise<string[]> {
  const ids = payloadIds(event.data);

  if (!ids.length) {
    return [];
  }

  const [entity] = event.name.split(".");

  if (entity === "product") {
    return ids;
  }

  if (entity === "sales-channel") {
    return productIdsInSalesChannels(query, ids);
  }

  const related = RELATED_ENTITIES[entity];

  return related
    ? relatedProductIds(query, related, ids, event.name.endsWith(".deleted"))
    : [];
}
