import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SaveExchangeClassifierCommand } from "./command";
import type { SavedExchangeClassifierDTO } from "./dto";
import { saveExchangeClassifierWorkflow } from "./workflow";

/** Сохраняет группы и свойства поставщика из `import.xml`. */
@Injectable()
export class SaveExchangeClassifierHandler extends AbstractCommandHandler<
  SaveExchangeClassifierCommand,
  SavedExchangeClassifierDTO
> {
  protected readonly workflow = saveExchangeClassifierWorkflow;
}
