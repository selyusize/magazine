import { MedusaService } from "@medusajs/framework/utils";

import { NetworkSettings } from "../entity/network-settings";
import { Shop } from "../entity/shop";
import { StorefrontRevalidation } from "../entity/storefront-revalidation";

/**
 * Магазины, реквизиты сети и журнал ревалидации витрин. Пишут только шаги команд (`create-shop`,
 * `update-network-settings`, `*-storefront-revalidation*`, CRUD — `../crud`).
 */
export class ShopModuleService extends MedusaService({
  Shop,
  NetworkSettings,
  StorefrontRevalidation,
}) {}
