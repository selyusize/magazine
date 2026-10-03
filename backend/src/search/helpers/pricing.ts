import type { SearchTypes } from "@medusajs/framework/types";
import { QueryContext, search } from "@medusajs/framework/utils";

import { numberOrNull, recordOf, recordOrNull, records } from "@shared/query/narrow";

/**
 * The currency the index holds prices in — the store sells in roubles. The price
 * fields below are named after it (`min_price_rub`), so filtering and sorting
 * work on the storefront's currency. Changing it is a schema change: the module
 * reindexes on the next boot. Keep in sync with the storefront's
 * `SEARCH_PRICE_CURRENCIES`.
 */
export const PRICE_CURRENCY = "rub";

// The Pricing Module calculates for a single currency per query.
const PRICE_GRAPH_FIELDS = [
  "id",
  "variants.calculated_price.calculated_amount",
  "variants.calculated_price.original_amount",
];

const pricingContext = {
  variants: {
    calculated_price: QueryContext({ currency_code: PRICE_CURRENCY }),
  },
};

/** A variant's calculated price in the index currency, as `loadPricing` reads it. */
export type VariantPrice = { calculated: number; original: number };

export type ProductPricing = {
  min_price_rub?: number;
  max_price_rub?: number;
  original_price_rub?: number;
  on_sale_rub?: boolean;
};

const priceField = () =>
  search
    .float()
    .filterable()
    .sortable()
    .facetable({ types: ["stats"] })
    .retrievable();

/** The price fields, to spread into the index schema. */
export const priceFields = {
  min_price_rub: priceField(),
  max_price_rub: priceField(),
  original_price_rub: search.float().retrievable(),
  on_sale_rub: search.boolean().filterable().facetable().retrievable(),
};

/**
 * The cheapest variant's calculated and original price, and the most expensive
 * variant's as the max. Picking one variant for the pair keeps the discount
 * describing a real product rather than mixing two variants' amounts. A product
 * without a price writes nothing, so it drops out of the price filter and sort.
 */
export function toProductPricing(variants: VariantPrice[] | undefined): ProductPricing {
  let cheapest: VariantPrice | undefined;
  let maxPrice: number | undefined;

  for (const price of variants ?? []) {
    if (maxPrice === undefined || price.calculated > maxPrice) maxPrice = price.calculated;
    if (!cheapest || price.calculated < cheapest.calculated) cheapest = price;
  }

  if (!cheapest) return {};

  return {
    min_price_rub: cheapest.calculated,
    max_price_rub: maxPrice ?? cheapest.calculated,
    original_price_rub: cheapest.original,
    // Written even when false: "not on sale" is a real facet bucket, unlike a
    // missing value.
    on_sale_rub: cheapest.original > cheapest.calculated,
  };
}

/** A variant row's calculated price; no calculated amount — no price. */
function toVariantPrice(variant: Record<string, unknown>): VariantPrice[] {
  const price = recordOrNull(variant.calculated_price);
  const calculated = numberOrNull(price?.calculated_amount);
  if (calculated === null) return [];
  return [{ calculated, original: numberOrNull(price?.original_amount) ?? calculated }];
}

/** The priced variants of the given products: one `query.graph` read, however many products there are. */
export async function loadPricing(
  ids: string[],
  { container }: SearchTypes.SearchIngestionContext,
): Promise<Map<string, VariantPrice[]>> {
  const pricing = new Map<string, VariantPrice[]>();

  if (!ids.length) {
    return pricing;
  }

  const { data } = await container.query.graph({
    entity: "product",
    fields: PRICE_GRAPH_FIELDS,
    filters: { id: ids },
    context: pricingContext,
  });

  for (const product of data) {
    pricing.set(product.id, records(recordOf(product).variants).flatMap(toVariantPrice));
  }

  return pricing;
}
