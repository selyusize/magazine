import { MedusaService } from "@medusajs/framework/utils";

import { Supplier } from "../entity/supplier";
import { SupplierOffer } from "../entity/supplier-offer";

/** Поставщики и их предложения. Пишут только шаги команд (CRUD — `../crud`). */
export class SupplierModuleService extends MedusaService({
  Supplier,
  SupplierOffer,
}) {}
