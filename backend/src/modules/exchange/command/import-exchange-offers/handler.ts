import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { ImportExchangeOffersCommand } from "./command";
import type { ImportedExchangeOffersDTO } from "./dto";
import { importExchangeOffersWorkflow } from "./workflow";

/** Импортирует пачку предложений поставщика. */
@Injectable()
export class ImportExchangeOffersHandler extends AbstractCommandHandler<
  ImportExchangeOffersCommand,
  ImportedExchangeOffersDTO
> {
  protected readonly workflow = importExchangeOffersWorkflow;
}
