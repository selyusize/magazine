import { Module } from "@medusajs/framework/utils";

import { FilterPageModuleService } from "./service/filter-page-module-service";

export const FILTER_PAGE_MODULE = "filter_page";

export default Module(FILTER_PAGE_MODULE, { service: FilterPageModuleService });
