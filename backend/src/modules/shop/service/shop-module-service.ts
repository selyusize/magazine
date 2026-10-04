import { MedusaService } from "@medusajs/framework/utils";

import { NetworkSettings } from "../entity/network-settings";
import { Shop } from "../entity/shop";

/** Магазины и реквизиты сети. Пишут только шаги команд (`create-shop`, `update-network-settings`, CRUD — `../crud`). */
export class ShopModuleService extends MedusaService({
  Shop,
  NetworkSettings,
}) {}
