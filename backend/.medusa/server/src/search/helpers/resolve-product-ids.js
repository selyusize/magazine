"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProductIds = resolveProductIds;
const RESOLVE_BATCH_SIZE = 200;
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
async function relatedProductIds(query, entity, fields, ids, pick, withDeleted) {
    const { data } = await query.graph({
        entity,
        fields,
        filters: { id: ids },
        withDeleted,
    });
    return data
        .flatMap(pick)
        .filter((id) => Boolean(id));
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
    const deleted = event.name.endsWith(".deleted");
    switch (entity) {
        case "product":
            return ids;
        case "product-variant":
            return relatedProductIds(query, "product_variant", ["product_id"], ids, (row) => [row.product_id], deleted);
        case "product-option":
            return relatedProductIds(query, "product_option", ["product_id"], ids, (row) => [row.product_id], deleted);
        case "product-option-value":
            return relatedProductIds(query, "product_option_value", ["option.product_id"], ids, (row) => [row.option?.product_id], deleted);
        case "product-tag":
            return relatedProductIds(query, "product_tag", ["products.id"], ids, (row) => (row.products ?? []).map((product) => product?.id), deleted);
        case "product-category":
            return relatedProductIds(query, "product_category", ["products.id"], ids, (row) => (row.products ?? []).map((product) => product?.id), deleted);
        case "sales-channel":
            return productIdsInSalesChannels(query, ids);
        default:
            return [];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZS1wcm9kdWN0LWlkcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9zZWFyY2gvaGVscGVycy9yZXNvbHZlLXByb2R1Y3QtaWRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBMEVBLDhDQWtFQztBQXZJRCxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztBQUUvQiwwREFBMEQ7QUFDMUQsU0FBUyxVQUFVLENBQUMsSUFBYTtJQUMvQixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3pDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUUsS0FBcUMsRUFBRSxFQUFFLENBQUM7U0FDMUQsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFnQixFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxLQUFLLFVBQVUsaUJBQWlCLENBQzlCLEtBQTBCLEVBQzFCLE1BQWMsRUFDZCxNQUFnQixFQUNoQixHQUFhLEVBQ2IsSUFBaUUsRUFDakUsV0FBb0I7SUFFcEIsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQztRQUNqQyxNQUFNO1FBQ04sTUFBTTtRQUNOLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUU7UUFDcEIsV0FBVztLQUNaLENBQUMsQ0FBQztJQUVILE9BQVEsSUFBOEI7U0FDbkMsT0FBTyxDQUFDLElBQUksQ0FBQztTQUNiLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBZ0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9DLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsS0FBSyxVQUFVLHlCQUF5QixDQUN0QyxL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