"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = seedDemoProducts;
/**
 * Demo data only — creates 50 published products so the store page's
 * pagination and option facets have something to work with. Safe to delete
 * along with the products it creates; nothing in the app depends on it.
 *
 *   npx medusa exec ./src/scripts/seed-demo-products.ts
 *
 * Re-running it is a no-op for anything it already created: every product uses
 * a deterministic handle, and existing handles are skipped.
 */
const core_flows_1 = require("@medusajs/medusa/core-flows");
const utils_1 = require("@medusajs/framework/utils");
const PRODUCT_COUNT = 50;
const HANDLE_PREFIX = 'demo';
/** Products are created in batches so one failure doesn't roll back all 50. */
const BATCH_SIZE = 10;
/** Caps the variant count per product, since options multiply. */
const MAX_VARIANTS = 12;
/** Products per awaited search-ingestion call. */
const INGEST_CHUNK_SIZE = 25;
/**
 * Deterministic PRNG (mulberry32). Keeps re-runs identical, so the same handle
 * always describes the same product.
 */
function makeRandom(seed) {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const ADJECTIVES = [
    'Vintage', 'Classic', 'Relaxed', 'Tailored', 'Oversized',
    'Everyday', 'Heritage', 'Essential', 'Cropped', 'Lightweight',
];
const MATERIALS = ['Cotton', 'Linen', 'Merino', 'Denim', 'Fleece', 'Twill'];
const TYPES = [
    'Tee', 'Hoodie', 'Sweatshirt', 'Shorts', 'Joggers',
    'Overshirt', 'Cap', 'Socks', 'Tote', 'Beanie',
];
const COLLECTIONS = ['Summer Essentials', 'Winter Layers', 'Everyday Basics', 'Limited Run'];
const TAGS = ['sale', 'new-arrival', 'organic', 'unisex', 'bestseller', 'last-chance'];
/** Shared options, so the store page's option facet has something to show. */
const SHARED_OPTIONS = [
    { title: 'Size', values: ['S', 'M', 'L', 'XL'] },
    { title: 'Color', values: ['Black', 'White'] },
    { title: 'Material', values: ['Cotton', 'Linen', 'Merino', 'Fleece'] },
    { title: 'Fit', values: ['Regular', 'Slim', 'Relaxed'] },
    { title: 'Sleeve', values: ['Short', 'Long'] },
];
/** Real Medusa demo images, so the grid isn't full of placeholders. */
const IMAGES = [
    'https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png',
    'https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png',
    'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png',
    'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png',
    'https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png',
    'https://medusa-public-images.s3.eu-west-1.amazonaws.com/coffee-mug.png',
];
async function seedDemoProducts({ container }) {
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
    const random = makeRandom(20260831);
    const pick = (items) => items[Math.floor(random() * items.length)];
    const pickSome = (items, max) => {
        const count = Math.floor(random() * (max + 1));
        return [...items].sort(() => random() - 0.5).slice(0, count);
    };
    // ---- Prerequisites that already exist in the project ----------------------
    const { data: salesChannels } = await query.graph({
        entity: 'sales_channel',
        fields: ['id', 'name'],
    });
    const { data: shippingProfiles } = await query.graph({
        entity: 'shipping_profile',
        fields: ['id'],
    });
    const { data: categories } = await query.graph({
        entity: 'product_category',
        fields: ['id', 'name'],
    });
    const { data: stores } = await query.graph({
        entity: 'store',
        fields: ['id', 'supported_currencies.currency_code'],
    });
    const salesChannel = salesChannels[0];
    const shippingProfile = shippingProfiles[0];
    if (!salesChannel || !shippingProfile) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, 'No sales channel or shipping profile found. Run the initial data seed first.');
    }
    const currencyCodes = (stores[0]?.supported_currencies ?? [])
        .map((currency) => currency?.currency_code)
        .filter((code) => Boolean(code));
    if (!currencyCodes.length) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, 'The store has no supported currencies.');
    }
    logger.info(`Seeding into "${salesChannel.name}" with currencies: ${currencyCodes.join(', ')}`);
    // ---- Collections, tags and extra options --------------------------------
    const { data: existingCollections } = await query.graph({
        entity: 'product_collection',
        fields: ['id', 'title'],
    });
    const missingCollections = COLLECTIONS.filter((title) => !existingCollections.some((collection) => collection.title === title));
    if (missingCollections.length) {
        await (0, core_flows_1.createCollectionsWorkflow)(container).run({
            input: { collections: missingCollections.map((title) => ({ title })) },
        });
        logger.info(`Created ${missingCollections.length} collection(s)`);
    }
    const { data: allCollections } = await query.graph({
        entity: 'product_collection',
        fields: ['id', 'title'],
    });
    const { data: existingTags } = await query.graph({
        entity: 'product_tag',
        fields: ['id', 'value'],
    });
    const missingTags = TAGS.filter((value) => !existingTags.some((tag) => tag.value === value));
    if (missingTags.length) {
        await (0, core_flows_1.createProductTagsWorkflow)(container).run({
            input: { product_tags: missingTags.map((value) => ({ value })) },
        });
        logger.info(`Created ${missingTags.length} tag(s)`);
    }
    const { data: allTags } = await query.graph({
        entity: 'product_tag',
        fields: ['id', 'value'],
    });
    // Shared (non-exclusive) options.
    const { data: existingOptions } = await query.graph({
        entity: 'product_option',
        fields: ['id', 'title', 'values.value'],
        filters: { is_exclusive: false },
    });
    const missingOptions = SHARED_OPTIONS.filter((option) => !existingOptions.some((existing) => existing.title === option.title));
    if (missingOptions.length) {
        await (0, core_flows_1.createProductOptionsWorkflow)(container).run({
            input: { product_options: missingOptions },
        });
        logger.info(`Created ${missingOptions.length} shared option(s)`);
    }
    const { data: optionRows } = await query.graph({
        entity: 'product_option',
        fields: ['id', 'title', 'values.value'],
        filters: { is_exclusive: false },
    });
    const sharedOptions = optionRows
        .map((option) => ({
        id: option.id,
        title: option.title,
        values: (option.values ?? [])
            .map((value) => value?.value)
            .filter((value) => Boolean(value)),
    }))
        .filter((option) => option.values.length > 0);
    const sizeOption = sharedOptions.find((option) => option.title === 'Size');
    if (!sizeOption) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, 'No shared "Size" option found.');
    }
    // ---- Build the products -------------------------------------------------
    const { data: alreadySeeded } = await query.graph({
        entity: 'product',
        fields: ['handle'],
    });
    const takenHandles = new Set(alreadySeeded.map((product) => product.handle).filter(Boolean));
    const products = [];
    for (let index = 0; index < PRODUCT_COUNT; index++) {
        // Derived from the index, never from the PRNG. Skipping a product consumes
        // fewer random numbers than building one, so a handle that depended on the
        // PRNG would shift after the first skip and the script would create
        // duplicates instead of recognising its own products.
        const type = TYPES[index % TYPES.length];
        const handle = `${HANDLE_PREFIX}-${index + 1}-${type.toLowerCase()}`;
        if (takenHandles.has(handle)) {
            continue;
        }
        const title = `${pick(ADJECTIVES)} ${pick(MATERIALS)} ${type}`;
        // Size is always present; the rest vary so the facet has uneven counts.
        const chosenOptions = [
            sizeOption,
            ...pickSome(sharedOptions.filter((option) => option.title !== 'Size'), 2),
        ];
        // Cartesian product of the chosen options' values, capped.
        let combinations = [{}];
        for (const option of chosenOptions) {
            const next = [];
            for (const combination of combinations) {
                for (const value of option.values) {
                    if (next.length >= MAX_VARIANTS) {
                        break;
                    }
                    next.push({ ...combination, [option.title]: value });
                }
            }
            combinations = next;
        }
        const collection = pick(allCollections);
        const chosenTags = pickSome(allTags, 3);
        const chosenCategories = pickSome(categories, 2);
        const thumbnail = pick(IMAGES);
        const basePrice = 10 + Math.floor(random() * 90);
        products.push({
            title,
            handle,
            subtitle: `${type} — demo data`,
            description: `A ${title.toLowerCase()} generated to fill out the demo catalogue. Not a real product.`,
            status: utils_1.ProductStatus.PUBLISHED,
            thumbnail,
            images: [{ url: thumbnail }],
            weight: 300 + Math.floor(random() * 500),
            shipping_profile_id: shippingProfile.id,
            collection_id: collection?.id,
            tag_ids: chosenTags.map((tag) => tag.id),
            category_ids: chosenCategories.map((category) => category.id),
            sales_channels: [{ id: salesChannel.id }],
            options: chosenOptions.map((option) => ({ id: option.id })),
            variants: combinations.map((combination) => ({
                title: Object.values(combination).join(' / '),
                // Dropshipping: no own stock location yet, stock comes with suppliers.
                manage_inventory: false,
                sku: `${handle.toUpperCase()}-${Object.values(combination).join('-').toUpperCase()}`,
                options: combination,
                prices: currencyCodes.map((currency_code) => ({
                    amount: basePrice,
                    currency_code,
                })),
            })),
        });
    }
    if (!products.length) {
        logger.info('Every demo product already exists. Nothing to do.');
        return;
    }
    // ---- Create them --------------------------------------------------------
    let created = 0;
    for (let start = 0; start < products.length; start += BATCH_SIZE) {
        const batch = products.slice(start, start + BATCH_SIZE);
        await (0, core_flows_1.createProductsWorkflow)(container).run({
            input: { products: batch },
        });
        created += batch.length;
        logger.info(`Created ${created}/${products.length} demo products`);
    }
    // ---- Make sure the search index caught up -------------------------------
    // `product.created` is emitted on the local event bus and handled
    // asynchronously, so a short-lived `medusa exec` process can exit before the
    // last batch is ingested. Replaying the ingestion here is awaited, and
    // `consume` upserts, so it is safe to run over every product.
    const search = container.resolve(utils_1.Modules.SEARCH);
    const { data: allProducts } = await query.graph({
        entity: 'product',
        fields: ['id'],
    });
    for (let start = 0; start < allProducts.length; start += INGEST_CHUNK_SIZE) {
        const chunk = allProducts.slice(start, start + INGEST_CHUNK_SIZE);
        await search.ingest({
            name: 'product.created',
            data: chunk.map((product) => ({ id: product.id })),
        });
    }
    logger.info(`Search index caught up for ${allProducts.length} product(s).`);
    logger.info('Done. Open the store page to see the new products.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VlZC1kZW1vLXByb2R1Y3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvc2VlZC1kZW1vLXByb2R1Y3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBa0ZBLG1DQWlSQztBQW5XRDs7Ozs7Ozs7O0dBU0c7QUFDSCw0REFLb0M7QUFDcEMscURBS2tDO0FBR2xDLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQTtBQUN4QixNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUE7QUFDNUIsK0VBQStFO0FBQy9FLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQTtBQUNyQixrRUFBa0U7QUFDbEUsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBO0FBQ3ZCLGtEQUFrRDtBQUNsRCxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQTtBQUU1Qjs7O0dBR0c7QUFDSCxTQUFTLFVBQVUsQ0FBQyxJQUFZO0lBQzlCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQTtJQUVoQixPQUFPLEdBQUcsRUFBRTtRQUNWLEtBQUssR0FBRyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFBO1FBQ3BELENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDOUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFBO0lBQzlDLENBQUMsQ0FBQTtBQUNILENBQUM7QUFF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