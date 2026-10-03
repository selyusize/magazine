import { Module } from "@medusajs/framework/utils";

import { CatalogModuleService } from "./service/catalog-module-service";

export const CATALOG_MODULE = "catalog";

export default Module(CATALOG_MODULE, { service: CatalogModuleService });
