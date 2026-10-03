import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { UpsertSupplierOffersCommand } from "./command";
import type { UpsertedSupplierOffersDTO } from "./dto";
import { upsertSupplierOffersWorkflow } from "./workflow";

/** Предложения из выгрузки поставщика пачкой + пересчёт остатков их вариантов. */
@Injectable()
export class UpsertSupplierOffersHandler extends AbstractCommandHandler<
  UpsertSupplierOffersCommand,
  UpsertedSupplierOffersDTO
> {
  protected readonly workflow = upsertSupplierOffersWorkflow;
}
