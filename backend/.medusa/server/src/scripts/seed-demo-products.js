"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = seedDemoProducts;
/**
 * Demo data only — creates 50 published products so the store page's
 * pagination and option facets have something to work with. Safe to delete
 * along with the products it creates; nothing in the app depends on it.
 *
 * Publishing goes the same way as for real products: drafts first, then a demo
 * supplier's offers (stock), a main category, and only then `published` — the
 * publish hook (src/workflows/hooks/product-publish-requirements.ts) rejects
 * anything less.
 *
 *   npx medusa exec ./src/scripts/seed-demo-products.ts
 *
 * Re-running it is a no-op for anything it already created: every product uses
 * a deterministic handle, and existing handles are skipped.
 */
const core_flows_1 = require("@medusajs/medusa/core-flows");
const utils_1 = require("@medusajs/framework/utils");
const index_1 = require("@container/index");
const handler_1 = require("@domain/catalog/command/update-catalog-for-product/handler");
const handler_2 = require("@domain/supplier/command/create-supplier-offer/handler");
const handler_3 = require("@domain/supplier/command/sync-inventory-for-supplier/handler");
const handler_4 = require("@domain/supplier/command/sync-stock-location-for-supplier/handler");
const supplier_1 = require("@domain/supplier/crud/supplier");
const PRODUCT_COUNT = 50;
const HANDLE_PREFIX = 'demo';
/** Products are created in batches so one failure doesn't roll back all 50. */
const BATCH_SIZE = 10;
/** Caps the variant count per product, since options multiply. */
const MAX_VARIANTS = 12;
/** Products per awaited search-ingestion call. */
const INGEST_CHUNK_SIZE = 25;
/** Every demo offer comes from this supplier; found by name on re-runs. */
const DEMO_SUPPLIER = { name: 'Демо-поставщик', ship_city: 'Москва' };
/** Used as the main category when the store has no categories yet. */
const DEMO_CATEGORY = { name: 'Демо-каталог', handle: 'demo-catalog' };
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
    let { data: categories } = await query.graph({
        entity: 'product_category',
        fields: ['id', 'name'],
    });
    // Publishing needs a main category, so the store needs at least one
    if (!categories.length) {
        await (0, core_flows_1.createProductCategoriesWorkflow)(container).run({
            input: { product_categories: [{ ...DEMO_CATEGORY, is_active: true }] },
        });
        ({ data: categories } = await query.graph({
            entity: 'product_category',
            fields: ['id', 'name'],
        }));
    }
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
        // At least one: the first becomes the main category
        const chosenCategories = pickSome(categories, 2);
        if (!chosenCategories.length)
            chosenCategories.push(pick(categories));
        const thumbnail = pick(IMAGES);
        const basePrice = 10 + Math.floor(random() * 90);
        products.push({
            title,
            handle,
            subtitle: `${type} — demo data`,
            description: `A ${title.toLowerCase()} generated to fill out the demo catalogue. Not a real product.`,
            status: utils_1.ProductStatus.DRAFT,
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
                // Dropshipping: stock is the demo supplier's offers, kept on its stock location.
                manage_inventory: true,
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
    const createdIds = [];
    for (let start = 0; start < products.length; start += BATCH_SIZE) {
        const batch = products.slice(start, start + BATCH_SIZE);
        const { result } = await (0, core_flows_1.createProductsWorkflow)(container).run({
            input: { products: batch },
        });
        createdIds.push(...result.map((product) => product.id));
        created += batch.length;
        logger.info(`Created ${created}/${products.length} demo products`);
    }
    // ---- Supplier offers, main category, publish ----------------------------
    const app = index_1.Container.from(container);
    const { data: existingSuppliers } = await query.graph({
        entity: 'supplier',
        fields: ['id'],
        filters: { name: DEMO_SUPPLIER.name },
    });
    const supplierId = existingSuppliers[0]?.id ??
        (await app.get(supplier_1.supplierCRUD.handlers.create).handle(DEMO_SUPPLIER)).id;
    // Normally the `supplier.created` subscriber does this; `medusa exec` may exit first
    await app.get(handler_4.SyncStockLocationForSupplierHandler).handle({ supplier_id: supplierId });
    const { data: drafts } = await query.graph({
        entity: 'product',
        fields: ['id', 'categories.id', 'variants.id', 'variants.sku'],
        filters: { id: createdIds },
    });
    for (const product of drafts) {
        for (const variant of product.variants ?? []) {
            if (!variant)
                continue;
            await app.get(handler_2.CreateSupplierOfferHandler).handle({
                supplier_id: supplierId,
                variant_id: variant.id,
                external_id: variant.sku ?? variant.id,
                sku: variant.sku ?? null,
                quantity: Math.floor(random() * 20),
            });
        }
        await app.get(handler_1.UpdateCatalogForProductHandler).handle({
            product_id: product.id,
            main_category_id: product.categories?.[0]?.id ?? null,
        });
    }
    await app.get(handler_3.SyncInventoryForSupplierHandler).handle({ supplier_id: supplierId });
    for (let start = 0; start < createdIds.length; start += BATCH_SIZE) {
        await (0, core_flows_1.updateProductsWorkflow)(container).run({
            input: {
                selector: { id: createdIds.slice(start, start + BATCH_SIZE) },
                update: { status: utils_1.ProductStatus.PUBLISHED },
            },
        });
    }
    logger.info(`Published ${createdIds.length} demo products with offers from "${DEMO_SUPPLIER.name}"`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VlZC1kZW1vLXByb2R1Y3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvc2VlZC1kZW1vLXByb2R1Y3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBb0dBLG1DQStVQztBQW5iRDs7Ozs7Ozs7Ozs7Ozs7R0FjRztBQUNILDREQU9vQztBQUNwQyxxREFLa0M7QUFHbEMsNENBQTRDO0FBQzVDLHdGQUEyRztBQUMzRyxvRkFBbUc7QUFDbkcsMEZBQThHO0FBQzlHLCtGQUF1SDtBQUN2SCw2REFBNkQ7QUFFN0QsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFBO0FBQ3hCLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQTtBQUM1QiwrRUFBK0U7QUFDL0UsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFBO0FBQ3JCLGtFQUFrRTtBQUNsRSxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUE7QUFDdkIsa0RBQWtEO0FBQ2xELE1BQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFBO0FBQzVCLDJFQUEyRTtBQUMzRSxNQUFNLGFBQWEsR0FBRyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUE7QUFDckUsc0VBQXNFO0FBQ3RFLE1BQU0sYUFBYSxHQUFHLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLENBQUE7QUFFdEU7OztHQUdHO0FBQ0gsU0FBUyxVQUFVLENBQUMsSUFBWTtJQUM5QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUE7SUFFaEIsT0FBTyxHQUFHLEVBQUU7UUFDVixLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FB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