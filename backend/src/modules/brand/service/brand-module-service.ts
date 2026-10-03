import { MedusaService } from "@medusajs/framework/utils";

import { Brand } from "../entity/brand";

/** Таблица брендов. Пишут только шаги команд (CRUD — `../crud`). */
export class BrandModuleService extends MedusaService({ Brand }) {}
