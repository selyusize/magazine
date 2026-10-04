import type { Definition } from "@shared/container";
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

/** Классы модуля shop собираются автоматически — определений нет. */
const definitions: Definition<unknown>[] = [];
export default definitions;
