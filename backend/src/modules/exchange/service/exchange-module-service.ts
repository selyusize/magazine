import { MedusaService } from "@medusajs/framework/utils";

import { ExchangeGroup } from "../entity/exchange-group";
import { ExchangeImage } from "../entity/exchange-image";
import { ExchangeProduct } from "../entity/exchange-product";
import { ExchangeProperty } from "../entity/exchange-property";
import { ImportRun } from "../entity/import-run";

/** Запуски импорта и справочники обмена с поставщиками. Пишут только шаги команд модуля. */
export class ExchangeModuleService extends MedusaService({
  ImportRun,
  ExchangeGroup,
  ExchangeProperty,
  ExchangeProduct,
  ExchangeImage,
}) {}
