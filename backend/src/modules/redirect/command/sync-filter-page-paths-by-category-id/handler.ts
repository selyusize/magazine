import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SyncFilterPagePathsByCategoryIdCommand } from "./command";
import { syncFilterPagePathsByCategoryIdWorkflow } from "./workflow";

/** Переименовали категорию → 301 со старых адресов всех её посадочных. */
@Injectable()
export class SyncFilterPagePathsByCategoryIdHandler extends AbstractCommandHandler<
  SyncFilterPagePathsByCategoryIdCommand,
  void
> {
  protected readonly workflow = syncFilterPagePathsByCategoryIdWorkflow;
}
