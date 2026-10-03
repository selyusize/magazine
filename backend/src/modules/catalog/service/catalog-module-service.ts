import { MedusaService } from "@medusajs/framework/utils";

import { ProductMainCategory } from "../entity/product-main-category";

/** Данные карточки товара сверх модуля product Medusa. Пишут только шаги команд. */
export class CatalogModuleService extends MedusaService({
  ProductMainCategory,
}) {}
