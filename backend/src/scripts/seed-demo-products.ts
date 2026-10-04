/**
 * Demo data only — creates 50 published products so the store page's
 * pagination and option facets have something to work with. Safe to delete
 * along with the products it creates; nothing in the app depends on it.
 *
 * Publishing goes the same way as for real products: drafts first, then a demo
 * supplier's offers (stock), a main category, and only then `published` — the
 * publish hook (src/workflows/hooks/product-guards.ts) rejects
 * anything less.
 *
 *   npx medusa exec ./src/scripts/seed-demo-products.ts
 *
 * Re-running it is a no-op for anything it already created: every product uses
 * a deterministic handle, and existing handles are skipped.
 */
import {
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductTagsWorkflow,
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import type {
  CreateProductWorkflowInputDTO,
  ExecArgs,
} from "@medusajs/framework/types";

import { Container } from "@container/index";
import { toStoredHandle } from "@shared/shop/shop-handle";
import { UpdateCatalogForProductHandler } from "@domain/catalog/command/update-catalog-for-product/handler";
import { CreateSupplierOfferHandler } from "@domain/supplier/command/create-supplier-offer/handler";
import { SyncInventoryForSupplierHandler } from "@domain/supplier/command/sync-inventory-for-supplier/handler";
import { SyncStockLocationForSupplierHandler } from "@domain/supplier/command/sync-stock-location-for-supplier/handler";
import { supplierCRUD } from "@domain/supplier/crud/supplier";
import { initialShopConfig } from "@container/common/shop";

const PRODUCT_COUNT = 50;
const HANDLE_PREFIX = "demo";
/** Products are created in batches so one failure doesn't roll back all 50. */
const BATCH_SIZE = 10;
/** Caps the variant count per product, since options multiply. */
const MAX_VARIANTS = 12;
/** Products per awaited search-ingestion call. */
const INGEST_CHUNK_SIZE = 25;
/** Every demo offer comes from this supplier; found by name on re-runs. */
const DEMO_SUPPLIER = { name: "Демо-поставщик", ship_city: "Москва" };
/** Used as the main category when the store has no categories yet. */
const DEMO_CATEGORY = { name: "Демо-каталог", handle: "demo-catalog" };

/**
 * Deterministic PRNG (mulberry32). Keeps re-runs identical, so the same handle
 * always describes the same product.
 */
function makeRandom(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ADJECTIVES = [
  "Vintage",
  "Classic",
  "Relaxed",
  "Tailored",
  "Oversized",
  "Everyday",
  "Heritage",
  "Essential",
  "Cropped",
  "Lightweight",
];
const MATERIALS = ["Cotton", "Linen", "Merino", "Denim", "Fleece", "Twill"];
const TYPES = [
  "Tee",
  "Hoodie",
  "Sweatshirt",
  "Shorts",
  "Joggers",
  "Overshirt",
  "Cap",
  "Socks",
  "Tote",
  "Beanie",
];

const COLLECTIONS = [
  "Summer Essentials",
  "Winter Layers",
  "Everyday Basics",
  "Limited Run",
];
const TAGS = [
  "sale",
  "new-arrival",
  "organic",
  "unisex",
  "bestseller",
  "last-chance",
];

/** Shared options, so the store page's option facet has something to show. */
const SHARED_OPTIONS = [
  { title: "Size", values: ["S", "M", "L", "XL"] },
  { title: "Color", values: ["Black", "White"] },
  { title: "Material", values: ["Cotton", "Linen", "Merino", "Fleece"] },
  { title: "Fit", values: ["Regular", "Slim", "Relaxed"] },
  { title: "Sleeve", values: ["Short", "Long"] },
];

/** Real Medusa demo images, so the grid isn't full of placeholders. */
const IMAGES = [
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png",
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/coffee-mug.png",
];

type SharedOption = { id: string; title: string; values: string[] };

export default async function seedDemoProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const random = makeRandom(20260831);

  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
  const pickSome = <T>(items: T[], max: number): T[] => {
    const count = Math.floor(random() * (max + 1));
    return [...items].sort(() => random() - 0.5).slice(0, count);
  };

  // ---- Prerequisites that already exist in the project ----------------------

  // Товары — в канал первого магазина (olisa): ключ его витрины видит только свой канал
  const { data: shops } = await query.graph({
    entity: "shop",
    fields: ["id", "root_category_id", "sales_channel.id", "sales_channel.name"],
    filters: { slug: initialShopConfig.slug },
  });
  const salesChannels = shops.flatMap((shop) =>
    shop.sales_channel ? [shop.sales_channel] : [],
  );
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  // Категории — только из дерева магазина (корень не в счёт): чужие хук товара отклонит
  const shopCategories = async () =>
    (
      await query.graph({
        entity: "product_category",
        fields: ["id", "name", "shop.id"],
      })
    ).data.filter(
      (category) =>
        category.shop?.id === shops[0]?.id &&
        category.id !== shops[0]?.root_category_id,
    );
  let categories = await shopCategories();
  // Publishing needs a main category, so the store needs at least one
  if (!categories.length && shops[0]) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            ...DEMO_CATEGORY,
            handle: toStoredHandle({ shop: initialShopConfig.slug, handle: DEMO_CATEGORY.handle }),
            parent_category_id: shops[0].root_category_id,
            is_active: true,
          },
        ],
      },
    });
    categories = await shopCategories();
  }
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code"],
  });

  const shop = shops[0];
  const salesChannel = salesChannels[0];
  const shippingProfile = shippingProfiles[0];

  if (!shop || !salesChannel || !shippingProfile) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No sales channel or shipping profile found. Run the initial data seed first.",
    );
  }

  const currencyCodes: string[] = (stores[0]?.supported_currencies ?? [])
    .map((currency) => currency?.currency_code)
    .filter((code): code is string => Boolean(code));

  if (!currencyCodes.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "The store has no supported currencies.",
    );
  }

  logger.info(
    `Seeding into "${salesChannel.name}" with currencies: ${currencyCodes.join(", ")}`,
  );

  // ---- Collections, tags and extra options --------------------------------

  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "title"],
  });
  const missingCollections = COLLECTIONS.filter(
    (title) =>
      !existingCollections.some((collection) => collection.title === title),
  );

  if (missingCollections.length) {
    await createCollectionsWorkflow(container).run({
      input: { collections: missingCollections.map((title) => ({ title })) },
    });
    logger.info(`Created ${missingCollections.length} collection(s)`);
  }

  const { data: allCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "title"],
  });

  const { data: existingTags } = await query.graph({
    entity: "product_tag",
    fields: ["id", "value"],
  });
  const missingTags = TAGS.filter(
    (value) => !existingTags.some((tag) => tag.value === value),
  );

  if (missingTags.length) {
    await createProductTagsWorkflow(container).run({
      input: { product_tags: missingTags.map((value) => ({ value })) },
    });
    logger.info(`Created ${missingTags.length} tag(s)`);
  }

  const { data: allTags } = await query.graph({
    entity: "product_tag",
    fields: ["id", "value"],
  });

  // Shared (non-exclusive) options.
  const { data: existingOptions } = await query.graph({
    entity: "product_option",
    fields: ["id", "title", "values.value"],
    filters: { is_exclusive: false },
  });

  const missingOptions = SHARED_OPTIONS.filter(
    (option) =>
      !existingOptions.some((existing) => existing.title === option.title),
  );

  if (missingOptions.length) {
    await createProductOptionsWorkflow(container).run({
      input: { product_options: missingOptions },
    });
    logger.info(`Created ${missingOptions.length} shared option(s)`);
  }

  const { data: optionRows } = await query.graph({
    entity: "product_option",
    fields: ["id", "title", "values.value"],
    filters: { is_exclusive: false },
  });

  const sharedOptions: SharedOption[] = optionRows
    .map((option) => ({
      id: option.id,
      title: option.title,
      values: (option.values ?? [])
        .map((value) => value?.value)
        .filter((value): value is string => Boolean(value)),
    }))
    .filter((option) => option.values.length > 0);

  const sizeOption = sharedOptions.find((option) => option.title === "Size");

  if (!sizeOption) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'No shared "Size" option found.',
    );
  }

  // ---- Build the products -------------------------------------------------

  const { data: alreadySeeded } = await query.graph({
    entity: "product",
    fields: ["handle"],
  });
  const takenHandles = new Set(
    alreadySeeded.map((product) => product.handle).filter(Boolean),
  );

  const products: CreateProductWorkflowInputDTO[] = [];

  for (let index = 0; index < PRODUCT_COUNT; index++) {
    // Derived from the index, never from the PRNG. Skipping a product consumes
    // fewer random numbers than building one, so a handle that depended on the
    // PRNG would shift after the first skip and the script would create
    // duplicates instead of recognising its own products.
    const type = TYPES[index % TYPES.length];
    const handle = toStoredHandle({
      shop: initialShopConfig.slug,
      handle: `${HANDLE_PREFIX}-${index + 1}-${type.toLowerCase()}`,
    });

    if (takenHandles.has(handle)) {
      continue;
    }

    const title = `${pick(ADJECTIVES)} ${pick(MATERIALS)} ${type}`;

    // Size is always present; the rest vary so the facet has uneven counts.
    const chosenOptions = [
      sizeOption,
      ...pickSome(
        sharedOptions.filter((option) => option.title !== "Size"),
        2,
      ),
    ];

    // Cartesian product of the chosen options' values, capped.
    let combinations: Record<string, string>[] = [{}];

    for (const option of chosenOptions) {
      const next: Record<string, string>[] = [];

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
    if (!chosenCategories.length) chosenCategories.push(pick(categories));
    const thumbnail = pick(IMAGES);
    const basePrice = 10 + Math.floor(random() * 90);

    products.push({
      title,
      handle,
      subtitle: `${type} — demo data`,
      description: `A ${title.toLowerCase()} generated to fill out the demo catalogue. Not a real product.`,
      status: ProductStatus.DRAFT,
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
        title: Object.values(combination).join(" / "),
        // Dropshipping: stock is the demo supplier's offers, kept on its stock location.
        manage_inventory: true,
        sku: `${handle.toUpperCase()}-${Object.values(combination).join("-").toUpperCase()}`,
        options: combination,
        prices: currencyCodes.map((currency_code) => ({
          amount: basePrice,
          currency_code,
        })),
      })),
    });
  }

  if (!products.length) {
    logger.info("Every demo product already exists. Nothing to do.");
    return;
  }

  // ---- Create them --------------------------------------------------------

  let created = 0;
  const createdIds: string[] = [];

  for (let start = 0; start < products.length; start += BATCH_SIZE) {
    const batch = products.slice(start, start + BATCH_SIZE);

    const { result } = await createProductsWorkflow(container).run({
      input: { products: batch },
    });
    createdIds.push(...result.map((product) => product.id));

    created += batch.length;
    logger.info(`Created ${created}/${products.length} demo products`);
  }

  // ---- Supplier offers, main category, publish ----------------------------

  const app = Container.from(container);
  const { data: existingSuppliers } = await query.graph({
    entity: "supplier",
    fields: ["id"],
    filters: { name: DEMO_SUPPLIER.name },
  });
  const supplierId =
    existingSuppliers[0]?.id ??
    (
      await app
        .get(supplierCRUD.handlers.create)
        .handle({ ...DEMO_SUPPLIER, shop_id: shop.id })
    ).id;
  // Normally the `supplier.created` subscriber does this; `medusa exec` may exit first
  await app
    .get(SyncStockLocationForSupplierHandler)
    .handle({ supplier_id: supplierId });

  const { data: drafts } = await query.graph({
    entity: "product",
    fields: ["id", "categories.id", "variants.id", "variants.sku"],
    filters: { id: createdIds },
  });

  for (const product of drafts) {
    for (const variant of product.variants ?? []) {
      if (!variant) continue;
      await app.get(CreateSupplierOfferHandler).handle({
        supplier_id: supplierId,
        variant_id: variant.id,
        external_id: variant.sku ?? variant.id,
        sku: variant.sku ?? null,
        quantity: Math.floor(random() * 20),
      });
    }
    await app.get(UpdateCatalogForProductHandler).handle({
      product_id: product.id,
      main_category_id: product.categories?.[0]?.id ?? null,
    });
  }
  await app
    .get(SyncInventoryForSupplierHandler)
    .handle({ supplier_id: supplierId });

  for (let start = 0; start < createdIds.length; start += BATCH_SIZE) {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: createdIds.slice(start, start + BATCH_SIZE) },
        update: { status: ProductStatus.PUBLISHED },
      },
    });
  }
  logger.info(
    `Published ${createdIds.length} demo products with offers from "${DEMO_SUPPLIER.name}"`,
  );

  // ---- Make sure the search index caught up -------------------------------

  // `product.created` is emitted on the local event bus and handled
  // asynchronously, so a short-lived `medusa exec` process can exit before the
  // last batch is ingested. Replaying the ingestion here is awaited, and
  // `consume` upserts, so it is safe to run over every product.
  const search = container.resolve(Modules.SEARCH);
  // Свежая БД (`make dev-reset`): индекса ещё нет — сервер при старте построит его целиком из БД
  const productIndex = (await search.listIndexes()).find(
    (index) => index.name === "product",
  );
  if (productIndex?.status !== "ready") {
    logger.info(
      `Search index "product" is ${productIndex?.status ?? "missing"} — it will be seeded from the DB on server start.`,
    );
    logger.info("Done. Start the backend (make dev-up) to build the search index.");
    return;
  }

  const { data: allProducts } = await query.graph({
    entity: "product",
    fields: ["id"],
  });

  for (let start = 0; start < allProducts.length; start += INGEST_CHUNK_SIZE) {
    const chunk = allProducts.slice(start, start + INGEST_CHUNK_SIZE);

    await search.ingest({
      name: "product.created",
      data: chunk.map((product) => ({ id: product.id })),
    });
  }

  logger.info(`Search index caught up for ${allProducts.length} product(s).`);
  logger.info("Done. Open the store page to see the new products.");
}
