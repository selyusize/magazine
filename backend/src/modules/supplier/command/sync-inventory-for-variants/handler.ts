import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SyncInventoryForVariantsCommand } from "./command";
import { syncInventoryForVariantsWorkflow } from "./workflow";

/** Пересчитывает остатки вариантов на складах поставщиков (после импорта — пачкой). */
@Injectable()
export class SyncInventoryForVariantsHandler extends AbstractCommandHandler<
  SyncInventoryForVariantsCommand,
  void
> {
  protected readonly workflow = syncInventoryForVariantsWorkflow;
}
