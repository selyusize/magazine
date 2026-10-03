"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProductIds = resolveProductIds;
const RESOLVE_BATCH_SIZE = 200;
const idsOf = (items) => Array.isArray(items)
    ? items.map((item) => item?.id)
    : [];
/**
 * Since Medusa 2.16 options are shared between products (`product_option.products`,
 * many-to-many): an option has no `product_id`, and one option leads to many products.
 */
const RELATED_ENTITIES = {
    "product-variant": {
        entity: "product_variant",
        fields: ["product_id"],
        pick: (row) => [row?.product_id],
    },
    "product-option": {
        entity: "product_option",
        fields: ["products.id"],
        pick: (row) => idsOf(row?.products),
    },
    "product-option-value": {
        entity: "product_option_value",
        fields: ["option.products.id"],
        pick: (row) => idsOf(row?.option?.products),
    },
    "product-tag": {
        entity: "product_tag",
        fields: ["products.id"],
        pick: (row) => idsOf(row?.products),
    },
    "product-category": {
        entity: "product_category",
        fields: ["products.id"],
        pick: (row) => idsOf(row?.products),
    },
};
// Core emits either a single `{ id }` or a batch of them.
function payloadIds(data) {
    return (Array.isArray(data) ? data : [data])
        .map((entry) => entry?.id)
        .filter((id) => Boolean(id));
}
/**
 * The products behind rows of another entity, read through `query.graph`.
 * Deleted rows are soft-deleted, so they're still readable with `withDeleted`,
 * which is how a deleted variant or category still leads back to its products.
 */
async function relatedProductIds(query, { entity, fields, pick }, ids, withDeleted) {
    const { data } = await query.graph({
        entity,
        fields,
        filters: { id: ids },
        withDeleted,
    });
    const productIds = data
        .flatMap(pick)
        .filter((id) => typeof id === "string" && id.length > 0);
    return Array.from(new Set(productIds));
}
/**
 * Deleting a sales channel removes its product links, so the products can no
 * longer be found through `query.graph`. The index still holds the channel on
 * each document, which is what's searched here.
 */
async function productIdsInSalesChannels(query, salesChannelIds) {
    const ids = [];
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
async function resolveProductIds(event, { container: { query } }) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1wcm9kdWN0LWlkcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9zZWFyY2gvaGVscGVycy9yZXNvbHZlLXByb2R1Y3QtaWRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBeUhBLDhDQXlCQztBQTdJRCxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztBQVcvQixNQUFNLEtBQUssR0FBRyxDQUFDLEtBQWMsRUFBYSxFQUFFLENBQzFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ2xCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBRSxJQUFnQyxFQUFFLEVBQUUsQ0FBQztJQUM1RCxDQUFDLENBQUMsRUFBRSxDQUFDO0FBRVQ7OztHQUdHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FBa0M7SUFDdEQsaUJBQWlCLEVBQUU7UUFDakIsTUFBTSxFQUFFLGlCQUFpQjtRQUN6QixNQUFNLEVBQUUsQ0FBQyxZQUFZLENBQUM7UUFDdEIsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUM7S0FDakM7SUFDRCxnQkFBZ0IsRUFBRTtRQUNoQixNQUFNLEVBQUUsZ0JBQWdCO1FBQ3hCLE1BQU0sRUFBRSxDQUFDLGFBQWEsQ0FBQztRQUN2QixJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDO0tBQ3BDO0lBQ0Qsc0JBQXNCLEVBQUU7UUFDdEIsTUFBTSxFQUFFLHNCQUFzQjtRQUM5QixNQUFNLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQztRQUM5QixJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUNaLEtBQUssQ0FBRSxHQUFHLEVBQUUsTUFBd0MsRUFBRSxRQUFRLENBQUM7S0FDbEU7SUFDRCxhQUFhLEVBQUU7UUFDYixNQUFN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