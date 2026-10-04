import type { FetchArgs, FetchInput } from "@medusajs/js-sdk";

import { ADMIN_SHOP_HEADER, readCurrentShopId } from "../shops/current-shop";
import { sdk } from "./sdk";

/**
 * Запрос к Admin API от своих страниц: та же сессия, что у дашборда, плюс заголовок магазина — из переключателя
 * или явный (`shopId`: блоки карточки товара работают в магазине товара). «Магазинные» роуты без заголовка
 * отвечают 400, сетевые — заголовок не читают.
 */
export function adminFetch<T>(
  input: FetchInput,
  init: FetchArgs = {},
  shopId: string | null = readCurrentShopId(),
): Promise<T> {
  return sdk.client.fetch<T>(input, {
    ...init,
    headers: shopId
      ? { ...init.headers, [ADMIN_SHOP_HEADER]: shopId }
      : init.headers,
  });
}
