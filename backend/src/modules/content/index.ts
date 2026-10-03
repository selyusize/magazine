import { Module } from "@medusajs/framework/utils";

import { ContentModuleService } from "./service/content-module-service";

export const CONTENT_MODULE = "content";

export default Module(CONTENT_MODULE, { service: ContentModuleService });
