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
exports.PRICE_CURRENCIES = ["rub"];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpY2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9zZWFyY2gvaGVscGVycy9wcmljaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQW9JQSw0Q0FTQztBQU1ELGtDQTRCQztBQTlLRCxxREFBaUU7QUFFakU7Ozs7O0dBS0c7QUFDVSxRQUFBLGdCQUFnQixHQUFHLENBQUMsS0FBSyxDQUFVLENBQUM7QUFJakQsMkVBQTJFO0FBQzNFLHNCQUFzQjtBQUN0QixNQUFNLGtCQUFrQixHQUFHO0lBQ3pCLElBQUk7SUFDSiw2Q0FBNkM7SUFDN0MsMkNBQTJDO0NBQzVDLENBQUM7QUFFRixNQUFNLGNBQWMsR0FBRyxDQUFDLFFBQXVCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbkQsUUFBUSxFQUFFO1FBQ1IsZ0JBQWdCLEVBQUUsSUFBQSxvQkFBWSxFQUFDLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxDQUFDO0tBQzVEO0NBQ0YsQ0FBQyxDQUFDO0FBMkJILHNFQUFzRTtBQUN6RCxRQUFBLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUMzQyx3QkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO0lBQ3JDO1FBQ0UsYUFBYSxRQUFRLEVBQUU7UUFDdkIsY0FBTTthQUNILEtBQUssRUFBRTthQUNQLFVBQVUsRUFBRTthQUNaLFFBQVEsRUFBRTthQUNWLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7YUFDL0IsV0FBVyxFQUFFO0tBQ2pCO0lBQ0Q7UUFDRSxhQUFhLFFBQVEsRUFBRTtRQUN2QixjQUFNO2FBQ0gsS0FBSyxFQUFFO2FBQ1AsVUFBVSxFQUFFO2FBQ1osUUFBUSxFQUFFO2FBQ1YsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzthQUMvQixXQUFXLEVBQUU7S0FDakI7SUFDRCxD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