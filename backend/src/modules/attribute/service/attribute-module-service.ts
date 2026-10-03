import { MedusaService } from "@medusajs/framework/utils";

import { Attribute } from "../entity/attribute";
import { AttributeValue } from "../entity/attribute-value";

/** Характеристики и их значения у товаров. Пишут только шаги команд (CRUD — `../crud`). */
export class AttributeModuleService extends MedusaService({
  Attribute,
  AttributeValue,
}) {}
