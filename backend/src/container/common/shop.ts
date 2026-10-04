import type { Definition } from "@shared/container";
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

/** Классы модуля shop собираются автоматически — определений нет. */
const definitions: Definition<unknown>[] = [];
export default definitions;
