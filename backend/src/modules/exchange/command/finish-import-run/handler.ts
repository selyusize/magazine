import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { FinishImportRunCommand } from "./command";
import { finishImportRunWorkflow } from "./workflow";

/** Завершает запуск импорта и сообщает о нём событием. */
@Injectable()
export class FinishImportRunHandler extends AbstractCommandHandler<FinishImportRunCommand, void> {
  protected readonly workflow = finishImportRunWorkflow;
}
