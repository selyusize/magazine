"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const option_values_1 = require("./helpers/option-values");
const pricing_1 = require("./helpers/pricing");
const resolve_product_ids_1 = require("./helpers/resolve-product-ids");
const PRODUCT_GRAPH_FIELDS = [
    "id",
    "title",
    "description",
    "handle",
    "thumbnail",
    "status",
    "created_at",
    "sales_channels.id",
    "categories.name",
    "tags.value",
    "options.title",
    "options.values.value",
];
const productFields = utils_1.search.define({
    id: utils_1.search.keyword().filterable().retrievable(),
    // Read by `/store/search` to scope the index; never returned to hits.
    status: utils_1.search.keyword().filterable().retrievable(false),
    sales_channel_ids: utils_1.search.keyword().array().filterable().retrievable(false),
    title: utils_1.search.text().searchable({ weight: 3 }).sortable().retrievable(),
    description: utils_1.search.text().searchable({ weight: 1 }),
    handle: utils_1.search.keyword().retrievable(),
    // Returned on hits only: never filtered, sorted or faceted on.
    thumbnail: utils_1.search.keyword().retrievable(),
    created_at: utils_1.search.date().sortable().retrievable(),
    category: utils_1.search.keyword().array().filterable().facetable().retrievable(),
    labels: utils_1.search.keyword().array().filterable().facetable().retrievable(),
    option_values: utils_1.search
        .keyword()
        .array()
        .searchable({ weight: 2 })
        .filterable()
        .facetable()
        .retrievable(),
    ...pricing_1.priceFields,
});
function toDocument(product, pricing) {
    const category = (product.categories ?? [])
        .map((productCategory) => productCategory?.name?.trim())
        .filter((name) => Boolean(name));
    const labels = (product.tags ?? [])
        .map((tag) => tag?.value?.trim())
        .filter((value) => Boolean(value));
    const salesChannelIds = (product.sales_channels ?? [])
        .map((salesChannel) => salesChannel?.id?.trim())
        .filter((id) => Boolean(id));
    return {
        id: product.id,
        status: product.status ?? null,
        sales_channel_ids: salesChannelIds,
        title: product.title ?? null,
        description: product.description ?? null,
        handle: product.handle ?? null,
        thumbnail: product.thumbnail ?? null,
        created_at: product.created_at ?? null,
        category,
        labels,
        option_values: (0, option_values_1.toOptionValues)(product.options),
        ...(0, pricing_1.toProductPricing)(pricing),
    };
}
/**
 * A row that returns no document leaves
 * the index: the helpers turn it into a delete on `consume` and on the
 * catch-up pass.
 */
const source = {
    fields: PRODUCT_GRAPH_FIELDS,
    transform: async (rows, context) => {
        const pricing = await (0, pricing_1.loadPricing)(rows.map((row) => row.id), context);
        return rows.map((row) => toDocument(row, pricing.get(row.id)));
    },
};
/**
 * Everything a document is built from, so a change to any of it re-indexes the
 * products it touches. Only `product.deleted` removes documents: a deleted
 * variant, option, tag or category means the product has to be re-read.
 *
 * TODO: price lists emit no events (create, update, delete, batch prices).
 * TODO: price lists crossing their start or end date change prices silently.
 * TODO: linkProductsToSalesChannelWorkflow emits nothing.
 * TODO: batchLinkProductsToCategoryWorkflow emits nothing.
 * TODO: upsertVariantPricesWorkflow emits nothing when called directly.
 */
const PRODUCT_EVENTS = [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "product-option.created",
    "product-option.updated",
    "product-option.deleted",
    "product-option-value.updated",
    "product-option-value.deleted",
    "product-tag.updated",
    "product-tag.deleted",
    "product-category.updated",
    "product-category.deleted",
    "sales-channel.deleted",
];
exports.default = (0, utils_1.defineSearchIndex)({
    name: "product",
    entity: "product",
    primary_key: "id",
    fields: productFields,
    settings: {
        typo_tolerance: { enabled: true },
    },
    events: PRODUCT_EVENTS,
    consume: (0, utils_1.graphConsume)({
        ...source,
        resolve_ids: resolve_product_ids_1.resolveProductIds,
        is_delete: (event) => event.name === "product.deleted",
    }),
    seed: (0, utils_1.graphSeed)(source),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zZWFyY2gvcHJvZHVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHFEQUttQztBQUVuQywyREFBMkU7QUFDM0UsK0NBQStFO0FBQy9FLHVFQUFrRTtBQUVsRSxNQUFNLG9CQUFvQixHQUFHO0lBQzNCLElBQUk7SUFDSixPQUFPO0lBQ1AsYUFBYTtJQUNiLFFBQVE7SUFDUixXQUFXO0lBQ1gsUUFBUTtJQUNSLFlBQVk7SUFDWixtQkFBbUI7SUFDbkIsaUJBQWlCO0lBQ2pCLFlBQVk7SUFDWixlQUFlO0lBQ2Ysc0JBQXNCO0NBQ3ZCLENBQUM7QUFpQkYsTUFBTSxhQUFhLEdBQUcsY0FBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQyxFQUFFLEVBQUUsY0FBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLFdBQVcsRUFBRTtJQUMvQyxzRUFBc0U7SUFDdEUsTUFBTSxFQUFFLGNBQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO0lBQ3hELGlCQUFpQixFQUFFLGNBQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO0lBQzNFLEtBQUssRUFBRSxjQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxFQUFFO0lBQ3ZFLFdBQVcsRUFBRSxjQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3BELE1BQU0sRUFBRSxjQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsV0FBVyxFQUFFO0lBQ3RDLCtEQUErRDtJQUMvRCxTQUFTLEVBQUUsY0FB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