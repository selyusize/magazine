import type { FetchArgs, FetchInput } from "@medusajs/js-sdk";

import { ADMIN_SHOP_HEADER, readCurrentShopId } from "../shops/current-shop";
import { sdk } from "./sdk";

/**
 * Запрос к Admin API от своих страниц: та же сессия, что у дашборда, плюс заголовок текущего магазина из
 * переключателя. «Магазинные» роуты без него отвечают 400, сетевые — заголовок не читают.
 */
export function adminFetch<T>(
  input: FetchInput,
  init: FetchArgs = {},
): Promise<T> {
  const shopId = readCurrentShopId();
  return sdk.client.fetch<T>(input, {
    ...init,
    headers: shopId
      ? { ...init.headers, [ADMIN_SHOP_HEADER]: shopId }
      : init.headers,
  });
}
