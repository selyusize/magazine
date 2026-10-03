import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SyncInventoryForSupplierCommand } from "./command";
import { syncInventoryForSupplierWorkflow } from "./workflow";

/** Пересчитывает остатки всех вариантов поставщика: удалён или выключен — его склад обнуляется. */
@Injectable()
export class SyncInventoryForSupplierHandler extends AbstractCommandHandler<
  SyncInventoryForSupplierCommand,
  void
> {
  protected readonly workflow = syncInventoryForSupplierWorkflow;
}
