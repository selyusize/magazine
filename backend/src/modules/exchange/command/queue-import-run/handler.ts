import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { QueueImportRunCommand } from "./command";
import type { QueuedImportRunDTO } from "./dto";
import { queueImportRunWorkflow } from "./workflow";

/** Ставит запуск импорта в очередь worker. */
@Injectable()
export class QueueImportRunHandler extends AbstractCommandHandler<QueueImportRunCommand, QueuedImportRunDTO> {
  protected readonly workflow = queueImportRunWorkflow;
}
