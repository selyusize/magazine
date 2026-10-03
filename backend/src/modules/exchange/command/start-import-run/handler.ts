import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { StartImportRunCommand } from "./command";
import type { StartedImportRunDTO } from "./dto";
import { startImportRunWorkflow } from "./workflow";

/** Заводит запуск импорта и его папку в хранилище обмена. */
@Injectable()
export class StartImportRunHandler extends AbstractCommandHandler<StartImportRunCommand, StartedImportRunDTO> {
  protected readonly workflow = startImportRunWorkflow;
}
