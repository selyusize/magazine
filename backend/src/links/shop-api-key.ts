import { defineLink } from "@medusajs/framework/utils";
import ApiKeyModule from "@medusajs/medusa/api-key";

import ShopModule from "../modules/shop";

/**
 * Publishable-ключ витрины магазина (1:1): его фронт шлёт в `x-publishable-api-key`. Пишет только `create-shop`.
 * Query: `shop.api_key`, `api_key.shop`.
 */
export default defineLink(
  ShopModule.linkable.shop,
  ApiKeyModule.linkable.apiKey,
);
