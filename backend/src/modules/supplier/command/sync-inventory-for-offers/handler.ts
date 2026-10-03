import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SyncInventoryForOffersCommand } from "./command";
import { syncInventoryForOffersWorkflow } from "./workflow";

/** Пересчитывает остатки вариантов изменённых предложений. */
@Injectable()
export class SyncInventoryForOffersHandler extends AbstractCommandHandler<
  SyncInventoryForOffersCommand,
  void
> {
  protected readonly workflow = syncInventoryForOffersWorkflow;
}
