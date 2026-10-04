import type { CRUDResource } from "../crud/types";

/**
 * Магазины сети — /admin/shops. Создание заводит канал продаж, publishable-ключ и корневую категорию; ключ
 * показывается в таблице и форме — его кладут в inventory Ansible фронта. Удаления нет, магазин выключают.
 */
export const shopsResource: CRUDResource = {
  path: "/admin/shops",
  response: { one: "shop", many: "shops" },
  i18n: "shops",
  title: "name",
  canDelete: false,
  columns: [
    { key: "name" },
    { key: "slug", kind: "mono" },
    { key: "domain" },
    { key: "is_active", kind: "boolean" },
    { key: "publishable_api_key", kind: "mono" },
  ],
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      createOnly: true,
      placeholder: "olisa",
    },
    { name: "domain", type: "text", required: true, placeholder: "olisa.ru" },
    {
      name: "storefront_url",
      type: "text",
      required: true,
      placeholder: "https://olisa.ru",
    },
    { name: "is_active", type: "boolean", default: true },
    { name: "publishable_api_key", type: "readonly" },
    { name: "settings", type: "json" },
  ],
};
