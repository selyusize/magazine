import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SyncEntityURLCommand } from "./command";
import { syncEntityURLWorkflow } from "./workflow";

/** Держит URL товаров, категорий и коллекций в порядке: slug вместо кириллицы и 301 при смене handle. */
@Injectable()
export class SyncEntityURLHandler extends AbstractCommandHandler<
  SyncEntityURLCommand,
  void
> {
  protected readonly workflow = syncEntityURLWorkflow;
}
