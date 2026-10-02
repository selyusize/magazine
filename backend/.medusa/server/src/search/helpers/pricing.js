"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceFields = exports.PRICE_CURRENCIES = void 0;
exports.toProductPricing = toProductPricing;
exports.loadPricing = loadPricing;
const utils_1 = require("@medusajs/framework/utils");
/**
 * The currencies the index holds prices in. Each gets its own set of price
 * fields, so filtering and sorting work per currency. Adding one is a schema
 * change: the module reindexes on the next boot. Keep in sync with the
 * storefront's `SEARCH_PRICE_CURRENCIES`.
 */
exports.PRICE_CURRENCIES = ["eur", "usd"];
// Read once per currency, since the Pricing Module calculates for a single
// currency per query.
const PRICE_GRAPH_FIELDS = [
    "id",
    "variants.calculated_price.calculated_amount",
    "variants.calculated_price.original_amount",
];
const pricingContext = (currency) => ({
    variants: {
        calculated_price: (0, utils_1.QueryContext)({ currency_code: currency }),
    },
});
/** The per-currency price fields, to spread into the index schema. */
exports.priceFields = Object.fromEntries(exports.PRICE_CURRENCIES.flatMap((currency) => [
    [
        `min_price_${currency}`,
        utils_1.search
            .float()
            .filterable()
            .sortable()
            .facetable({ types: ["stats"] })
            .retrievable(),
    ],
    [
        `max_price_${currency}`,
        utils_1.search
            .float()
            .filterable()
            .sortable()
            .facetable({ types: ["stats"] })
            .retrievable(),
    ],
    [`original_price_${currency}`, utils_1.search.float().retrievable()],
    [
        `on_sale_${currency}`,
        utils_1.search.boolean().filterable().facetable().retrievable(),
    ],
]));
/**
 * One currency's price fields: the cheapest variant's calculated and original
 * price, and the most expensive variant's as the max. Picking one variant for
 * the pair keeps the discount describing a real product rather than mixing
 * two variants' amounts. A product without a price in the currency writes
 * nothing, so it drops out of that currency's price filter and sort.
 */
function toPricing(currency, variants) {
    let cheapest;
    let maxPrice;
    for (const variant of variants ?? []) {
        const price = variant?.calculated_price;
        const calculated = price?.calculated_amount;
        if (typeof calculated !== "number") {
            continue;
        }
        const original = typeof price?.original_amount === "number"
            ? price.original_amount
            : calculated;
        if (maxPrice === undefined || calculated > maxPrice) {
            maxPrice = calculated;
        }
        if (!cheapest || calculated < cheapest.calculated) {
            cheapest = { calculated, original };
        }
    }
    if (!cheapest) {
        return {};
    }
    return {
        [`min_price_${currency}`]: cheapest.calculated,
        [`max_price_${currency}`]: maxPrice ?? cheapest.calculated,
        [`original_price_${currency}`]: cheapest.original,
        // Written even when false: "not on sale" is a real facet bucket, unlike a
        // missing value.
        [`on_sale_${currency}`]: cheapest.original > cheapest.calculated,
    };
}
/** Every currency's price fields for one product. */
function toProductPricing(pricingRows) {
    return Object.assign({}, ...exports.PRICE_CURRENCIES.map((currency) => toPricing(currency, pricingRows?.[currency])));
}
/**
 * The priced variants of the given products, per currency: one `query.graph`
 * read per currency, however many products there are.
 */
async function loadPricing(ids, { container }) {
    const pricing = new Map();
    if (!ids.length) {
        return pricing;
    }
    await Promise.all(exports.PRICE_CURRENCIES.map(async (currency) => {
        const { data } = await container.query.graph({
            entity: "product",
            fields: PRICE_GRAPH_FIELDS,
            filters: { id: ids },
            context: pricingContext(currency),
        });
        for (const product of data) {
            const rows = pricing.get(product.id) ?? {};
            rows[currency] = product.variants;
            pricing.set(product.id, rows);
        }
    }));
    return pricing;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpY2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9zZWFyY2gvaGVscGVycy9wcmljaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQW9JQSw0Q0FTQztBQU1ELGtDQTRCQztBQTlLRCxxREFBaUU7QUFFakU7Ozs7O0dBS0c7QUFDVSxRQUFBLGdCQUFnQixHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBVSxDQUFDO0FBSXhELDJFQUEyRTtBQUMzRSxzQkFBc0I7QUFDdEIsTUFBTSxrQkFBa0IsR0FBRztJQUN6QixJQUFJO0lBQ0osNkNBQTZDO0lBQzdDLDJDQUEyQztDQUM1QyxDQUFDO0FBRUYsTUFBTSxjQUFjLEdBQUcsQ0FBQyxRQUF1QixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ25ELFFBQVEsRUFBRTtRQUNSLGdCQUFnQixFQUFFLElBQUEsb0JBQVksRUFBQyxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsQ0FBQztLQUM1RDtDQUNGLENBQUMsQ0FBQztBQTJCSCxzRUFBc0U7QUFDekQsUUFBQSxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FDM0Msd0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztJQUNyQztRQUNFLGFBQWEsUUFBUSxFQUFFO1FBQ3ZCLGNBQU07YUFDSCxLQUFLLEVBQUU7YUFDUCxVQUFVLEVBQUU7YUFDWixRQUFRLEVBQUU7YUFDVixTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2FBQy9CLFdBQVcsRUFBRTtLQUNqQjtJQUNEO1FBQ0UsYUFBYSxRQUFRLEVBQUU7UUFDdkIsY0FBTTthQUNILEtBQUssRUFBRTthQUNQLFVBQVUsRUFBRTthQUNaLFFBQVEsRUFBRTthQUNWLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7YUFDL0IsV0FBVyxFQUFFO0tB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