import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SaveImportRunProgressCommand } from "./command";
import { saveImportRunProgressWorkflow } from "./workflow";

/** Сохраняет ход запуска импорта. */
@Injectable()
export class SaveImportRunProgressHandler extends AbstractCommandHandler<SaveImportRunProgressCommand, void> {
  protected readonly workflow = saveImportRunProgressWorkflow;
}
