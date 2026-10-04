import type { ICachingModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import { define } from "@shared/container";
import { recordOf, text, textOrNull } from "@shared/query/narrow";
import {
  CacheInvalidationRegistry,
  CacheInvalidator,
  on,
  type CacheEntityRow,
  type CacheInvalidationRule,
  type StorefrontTarget,
} from "@shared/service/cache-invalidation/cache-invalidator";
import { entityTag, STOREFRONT_TAGS as T } from "@shared/service/cache-invalidation/storefront-tags";
import { SecretBox } from "@shared/service/crypto/secret-box";
import { StorefrontRevalidator } from "@shared/service/storefront/storefront-revalidator";
import {
  categoryShopId,
  CATEGORY_SHOP_FIELDS,
  COLLECTION_SHOP_FIELDS,
  collectionShopId,
  PRODUCT_SHOP_FIELDS,
  toProductShop,
} from "@shared/shop/catalog-shop";
import { toPublicHandle } from "@shared/shop/shop-handle";
import { SHOP_CACHE_TAG } from "@domain/shop/cache";
import { RevalidationSchedule } from "@domain/shop/service/revalidation-schedule";

const handleOf = (row: CacheEntityRow): string => toPublicHandle(text(row.handle));
const ownShop = (row: CacheEntityRow): string | null => textOrNull(row.shop_id);

/**
 * Сущности витрины: где магазин и какие теги сбрасывает её изменение. Теги — словарь `storefront-tags.ts`
 * (контракт с фронтами, `docs/storefront.md`); `orphan_tags` — всем магазинам, если сущности уже нет.
 */
const STOREFRONT_ENTITIES = {
  product: {
    scope: "entity",
    entity: "product",
    fields: ["id", "handle", ...PRODUCT_SHOP_FIELDS],
    shopOf: (row) => toProductShop(row).shop_id,
    tags: (row) => [entityTag("product", handleOf(row)), T.products, T.sitemap],
    orphan_tags: [T.products, T.sitemap],
  },
  // Цена и остаток — у варианта: сбрасывается его товар
  product_variant: {
    scope: "entity",
    entity: "product_variant",
    fields: ["id", "product.handle", ...PRODUCT_SHOP_FIELDS.map((field) => `product.${field}`)],
    shopOf: (row) => toProductShop(row.product).shop_id,
    tags: (row) => [entityTag("product", handleOf(recordOf(row.product))), T.products],
    orphan_tags: [T.products],
  },
  product_category: {
    scope: "entity",
    entity: "product_category",
    fields: ["id", "handle", ...CATEGORY_SHOP_FIELDS],
    shopOf: categoryShopId,
    tags: (row) => [entityTag("category", handleOf(row)), T.categories, T.navigation, T.sitemap],
    orphan_tags: [T.categories, T.navigation, T.sitemap],
  },
  product_collection: {
    scope: "entity",
    entity: "product_collection",
    fields: ["id", "handle", ...COLLECTION_SHOP_FIELDS],
    shopOf: collectionShopId,
    tags: (row) => [entityTag("collection", handleOf(row)), T.collections, T.sitemap],
    orphan_tags: [T.collections, T.sitemap],
  },
  // Бренд виден и на карточках товаров
  brand: {
    scope: "entity",
    entity: "brand",
    fields: ["id", "shop_id", "handle"],
    shopOf: ownShop,
    tags: (row) => [entityTag("brand", handleOf(row)), T.brands, T.products, T.sitemap],
    orphan_tags: [T.brands, T.products, T.sitemap],
  },
  // Характеристики — в карточках и фильтрах товаров
  attribute: {
    scope: "entity",
    entity: "attribute",
    fields: ["id", "shop_id"],
    shopOf: ownShop,
    tags: () => [T.products],
    orphan_tags: [T.products],
  },
  article: {
    scope: "entity",
    entity: "article",
    fields: ["id", "shop_id", "handle"],
    shopOf: ownShop,
    tags: (row) => [entityTag("article", handleOf(row)), T.articles, T.sitemap],
    orphan_tags: [T.articles, T.sitemap],
  },
  filter_page: {
    scope: "entity",
    entity: "filter_page",
    fields: ["id", "shop_id", "handle", "product_category.handle"],
    shopOf: ownShop,
    tags: (row) => {
      const category = toPublicHandle(text(recordOf(row.product_category).handle));
      return [
        entityTag("filter-page", `${category}/${handleOf(row)}`),
        entityTag("category", category),
        T.filterPages,
        T.sitemap,
      ];
    },
    orphan_tags: [T.filterPages, T.sitemap],
  },
  // Импорт поставщика закончился — одна пачка групповых тегов его магазину (товары шли и своими событиями)
  import_run: {
    scope: "entity",
    entity: "import_run",
    fields: ["id", "supplier.shop_id"],
    shopOf: (row) => textOrNull(recordOf(row.supplier).shop_id),
    tags: () => [T.products, T.categories, T.navigation, T.brands, T.sitemap],
    orphan_tags: [],
  },
} satisfies Record<string, StorefrontTarget>;

const crud = (entity: string) => [`${entity}.created`, `${entity}.updated`, `${entity}.deleted`];

/**
 * Реестр инвалидации: событие изменения → теги кэша бэкенда и теги витрин своего магазина (сетевой сущности — всех
 * магазинов). Новый кэш (`cached(..., tags)`, тег витрины) регистрирует здесь свои события — строка на сущность.
 */
export const cacheInvalidationRules: CacheInvalidationRule[] = [
  ...on(["shop.created"], { backend: () => [SHOP_CACHE_TAG] }),
  ...on(["shop.updated"], {
    backend: () => [SHOP_CACHE_TAG],
    storefront: { scope: "shop", field: "id", tags: [T.shop] },
  }),
  ...on(["network_settings.updated"], { storefront: { scope: "network", tags: [T.shop] } }),
  ...on(["region.updated"], { storefront: { scope: "network", tags: [T.regions, T.products] } }),
  ...on(crud("product"), { storefront: STOREFRONT_ENTITIES.product }),
  ...on(crud("product-variant"), { storefront: STOREFRONT_ENTITIES.product_variant }),
  ...on(crud("product-category"), { storefront: STOREFRONT_ENTITIES.product_category }),
  ...on(crud("product-collection"), { storefront: STOREFRONT_ENTITIES.product_collection }),
  ...on(crud("brand"), { storefront: STOREFRONT_ENTITIES.brand }),
  ...on(crud("attribute"), { storefront: STOREFRONT_ENTITIES.attribute }),
  ...on(crud("article"), { storefront: STOREFRONT_ENTITIES.article }),
  ...on(crud("filter_page"), { storefront: STOREFRONT_ENTITIES.filter_page }),
  ...on(["redirect.updated"], { storefront: { scope: "shop", field: "shop_id", tags: [T.redirects, T.sitemap] } }),
  ...on(["import_run.completed"], { storefront: STOREFRONT_ENTITIES.import_run }),
];

/** События реестра — на них подписан `src/subscribers/cache-invalidation.ts`. */
export const cacheInvalidationEvents = new CacheInvalidationRegistry(cacheInvalidationRules).events;

const isProduction = process.env.NODE_ENV === "production";
const number = (value: string | undefined, fallback: number): number =>
  value && Number.isFinite(Number(value)) ? Number(value) : fallback;

/**
 * Очередь ревалидации витрин: окно дебаунса (`STOREFRONT_REVALIDATE_WINDOW_MS`), потолок ожидания, паузы повторов,
 * предел тегов сущностей в пачке, срок хранения журнала.
 */
export const revalidationScheduleConfig = {
  window_ms: number(process.env.STOREFRONT_REVALIDATE_WINDOW_MS, 3_000),
  max_wait_ms: number(process.env.STOREFRONT_REVALIDATE_MAX_WAIT_MS, 30_000),
  retry_delays_ms: [10_000, 60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000],
  tag_limit: 100,
  stale_sending_ms: 5 * 60_000,
  keep_days: 7,
};

/**
 * Ключ шифрования секретов магазинов в БД. На проде обязателен (vault); в dev — от `COOKIE_SECRET`, чтобы
 * `make dev-reset` не требовал лишней переменной.
 */
const shopSecretsKey =
  process.env.SHOP_SECRETS_KEY || (isProduction ? "" : process.env.COOKIE_SECRET || "supersecret");

export default [
  define(CacheInvalidationRegistry, () => new CacheInvalidationRegistry(cacheInvalidationRules)),
  define(
    CacheInvalidator,
    ({ get, container }) =>
      new CacheInvalidator(
        get(CacheInvalidationRegistry),
        container.resolve<ICachingModuleService | undefined>(Modules.CACHING, {
          allowUnregistered: true,
        }),
        container.resolve(ContainerRegistrationKeys.LOGGER),
      ),
  ),
  define(RevalidationSchedule, () => new RevalidationSchedule(revalidationScheduleConfig)),
  define(SecretBox, () => new SecretBox(shopSecretsKey)),
  define(
    StorefrontRevalidator,
    ({ container }) =>
      new StorefrontRevalidator(
        {
          timeout_ms: number(process.env.STOREFRONT_REVALIDATE_TIMEOUT_MS, 10_000),
          allowed_hosts: (process.env.STOREFRONT_REVALIDATE_HOSTS ?? "")
            .split(",")
            .map((host) => host.trim())
            .filter(Boolean),
        },
        container.resolve(ContainerRegistrationKeys.LOGGER),
      ),
  ),
];
