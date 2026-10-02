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
/**
 * Extra shared options, so the store page's option facet shows more than the
 * Size and Color the initial seed creates.
 */
const EXTRA_OPTIONS = [
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
    // Shared (non-exclusive) options, the way the initial seed defines them.
    const { data: existingOptions } = await query.graph({
        entity: 'product_option',
        fields: ['id', 'title', 'values.value'],
        filters: { is_exclusive: false },
    });
    const missingOptions = EXTRA_OPTIONS.filter((option) => !existingOptions.some((existing) => existing.title === option.title));
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
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, 'No shared "Size" option found. Run the initial data seed first.');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VlZC1kZW1vLXByb2R1Y3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvc2VlZC1kZW1vLXByb2R1Y3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBbUZBLG1DQStRQztBQWxXRDs7Ozs7Ozs7O0dBU0c7QUFDSCw0REFLb0M7QUFDcEMscURBS2tDO0FBR2xDLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQTtBQUN4QixNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUE7QUFDNUIsK0VBQStFO0FBQy9FLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQTtBQUNyQixrRUFBa0U7QUFDbEUsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBO0FBQ3ZCLGtEQUFrRDtBQUNsRCxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQTtBQUU1Qjs7O0dBR0c7QUFDSCxTQUFTLFVBQVUsQ0FBQyxJQUFZO0lBQzlCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQTtJQUVoQixPQUFPLEdBQUcsRUFBRTtRQUNWLEtBQUssR0FBRyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFBO1FBQ3BELENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDOUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFBO0lBQzlDLENBQUMsQ0FBQTtBQUNILENBQUM7QUFF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