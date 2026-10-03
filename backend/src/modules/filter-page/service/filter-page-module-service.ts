import { MedusaService } from "@medusajs/framework/utils";

import { FilterPage } from "../entity/filter-page";

/** Таблица посадочных. Пишут только шаги команд. */
export class FilterPageModuleService extends MedusaService({ FilterPage }) {}
