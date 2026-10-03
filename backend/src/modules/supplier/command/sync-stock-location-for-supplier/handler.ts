import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SyncStockLocationForSupplierCommand } from "./command";
import { syncStockLocationForSupplierWorkflow } from "./workflow";

/** Создаёт или обновляет виртуальный склад поставщика и пересчитывает остатки на нём. */
@Injectable()
export class SyncStockLocationForSupplierHandler extends AbstractCommandHandler<
  SyncStockLocationForSupplierCommand,
  void
> {
  protected readonly workflow = syncStockLocationForSupplierWorkflow;
}
