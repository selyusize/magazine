import { Module } from "@medusajs/framework/utils";

import { ShopModuleService } from "./service/shop-module-service";

export const SHOP_MODULE = "shop";

export default Module(SHOP_MODULE, { service: ShopModuleService });
