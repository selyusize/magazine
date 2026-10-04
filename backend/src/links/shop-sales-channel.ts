import { defineLink } from "@medusajs/framework/utils";
import SalesChannelModule from "@medusajs/medusa/sales-channel";

import ShopModule from "../modules/shop";

/**
 * Канал продаж магазина (1:1): товары, корзины и заказы магазина живут в его канале. Пишет только `create-shop`.
 * Query: `shop.sales_channel`, `sales_channel.shop`.
 */
export default defineLink(
  ShopModule.linkable.shop,
  SalesChannelModule.linkable.salesChannel,
);
