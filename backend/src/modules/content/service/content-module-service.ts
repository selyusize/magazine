import { MedusaService } from "@medusajs/framework/utils";

import { Article } from "../entity/article";

/** Контент магазина: статьи (позже — страницы «Доставка», «Оплата»…). Пишут только шаги команд. */
export class ContentModuleService extends MedusaService({ Article }) {}
