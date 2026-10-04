import type { Definition } from "@shared/container";
import type { StoreHandleParams, StoreShopScopedRoute } from "@shared/shop/shop-handle";
import type { ShopOwnedRoute } from "@shared/shop/shop-ownership";
import type { CreateShopCommand } from "@domain/shop/command/create-shop/command";

const storefrontURL = process.env.STOREFRONT_URL || "http://localhost:3000";

/**
 * Первый магазин сети — его создаёт сид (`initial-data-seed`) тем же workflow, что и кнопка в админке.
 * Домен — из адреса витрины: в dev `localhost:3000`, на проде — `https://{{ frontend_domain }}` из Ansible.
 */
export const initialShopConfig: CreateShopCommand = {
  slug: process.env.INITIAL_SHOP_SLUG || "olisa",
  name: process.env.INITIAL_SHOP_NAME || "Olisa",
  domain: new URL(storefrontURL).host,
  storefront_url: storefrontURL,
  settings: {},
  // Тот же секрет `make dev-key` кладёт во frontend/.env.local (`REVALIDATE_SECRET`); не задан — случайный
  revalidate_secret: process.env.INITIAL_SHOP_REVALIDATE_SECRET || undefined,
};

/**
 * Реестр сущностей магазина в Admin API: `/admin/{resource}/:id` и вложенные пути — только из своего магазина
 * (`x-shop-id`), чужая сущность — 404. Новая сущность магазина с роутами по id — одна строка здесь; списки
 * фильтрует сама сущность (`shopScoped` в CRUD-фабрике или `shop_id` в запросе фетчера).
 */
export const shopOwnedRoutes: ShopOwnedRoute[] = [
  { matcher: "/admin/suppliers/:id", entity: "supplier", shop_field: "shop_id", label: "поставщик" },
  { matcher: "/admin/brands/:id", entity: "brand", shop_field: "shop_id", label: "бренд" },
  { matcher: "/admin/attributes/:id", entity: "attribute", shop_field: "shop_id", label: "характеристика" },
  { matcher: "/admin/articles/:id", entity: "article", shop_field: "shop_id", label: "статья" },
  { matcher: "/admin/filter-pages/:id", entity: "filter_page", shop_field: "shop_id", label: "посадочная" },
  // Рядом статический `POST /admin/redirects/import` — у правила по id есть только DELETE
  { matcher: "/admin/redirects/:id", entity: "redirect", shop_field: "shop_id", label: "редирект", methods: ["DELETE"] },
  { matcher: "/admin/import-runs/:id", entity: "import_run", shop_field: "supplier.shop_id", label: "запуск импорта" },
  {
    matcher: "/admin/exchange-groups/:id",
    entity: "exchange_group",
    shop_field: "supplier.shop_id",
    label: "группа поставщика",
  },
  {
    matcher: "/admin/exchange-properties/:id",
    entity: "exchange_property",
    shop_field: "supplier.shop_id",
    label: "свойство поставщика",
  },
  {
    matcher: "/admin/supplier-offers/:id",
    entity: "supplier_offer",
    shop_field: "supplier.shop_id",
    label: "предложение поставщика",
  },
  // Блоки карточки товара: роуты Medusa `/admin/products/:id` — сетевые, свои подпути — в магазине товара
  ...["catalog", "attributes", "supplier-offers"].map(
    (block): ShopOwnedRoute => ({
      matcher: `/admin/products/:id/${block}`,
      entity: "product",
      shop_field: "sales_channels.shop.id",
      label: "товар",
    }),
  ),
];

/**
 * Реестр фильтров по handle в Store API: handle витрины в query получает префикс магазина ключа
 * (`?handle=utyug` → `olisaːutyug`). Новый роут Medusa с фильтром по handle сущности Medusa — одна строка здесь;
 * свои роуты страниц (`/store/pages/...`) переводят handle сами через `toShopHandle`.
 */
export const storeHandleParams: StoreHandleParams[] = [
  { matcher: "/store/products", params: ["handle"] },
  { matcher: "/store/product-categories", params: ["handle"] },
  { matcher: "/store/collections", params: ["handle"] },
];

/**
 * Реестр сущностей Medusa без канала продаж в Store API: Medusa не делит их по магазинам, поэтому список — только
 * магазина ключа (префикс handle), карточка `/:id` чужой — 404. Товары Medusa уже ограничивает каналом ключа.
 */
export const storeShopScopedRoutes: StoreShopScopedRoute[] = [
  { matcher: "/store/product-categories", entity: "product_category", label: "категория" },
  { matcher: "/store/collections", entity: "product_collection", label: "коллекция" },
];

/**
 * Реестр сущностей магазина по id в Store API — как `shopOwnedRoutes`, но магазин — ключа витрины. Корзина живёт в
 * канале магазина: по ключу другого магазина её не видно (заказы — сетевые: «Мои заказы» общие на сеть).
 */
export const storeShopOwnedRoutes: ShopOwnedRoute[] = [
  { matcher: "/store/carts/:id", entity: "cart", shop_field: "sales_channel.shop.id", label: "корзина" },
];

/** Классы модуля shop собираются автоматически — определений нет. */
const definitions: Definition<unknown>[] = [];
export default definitions;
