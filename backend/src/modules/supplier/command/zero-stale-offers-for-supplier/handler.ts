import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { ZeroStaleOffersForSupplierCommand } from "./command";
import { zeroStaleOffersForSupplierWorkflow } from "./workflow";

/** Обнуляет остатки предложений поставщика, которых нет в полной выгрузке (карточки не удаляются). */
@Injectable()
export class ZeroStaleOffersForSupplierHandler extends AbstractCommandHandler<
  ZeroStaleOffersForSupplierCommand,
  { count: number }
> {
  protected readonly workflow = zeroStaleOffersForSupplierWorkflow;
}
