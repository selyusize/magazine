import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { StageExchangeProductsCommand } from "./command";
import type { StagedExchangeProductsDTO } from "./dto";
import { stageExchangeProductsWorkflow } from "./workflow";

/** Запоминает пачку товаров `import.xml`. */
@Injectable()
export class StageExchangeProductsHandler extends AbstractCommandHandler<
  StageExchangeProductsCommand,
  StagedExchangeProductsDTO
> {
  protected readonly workflow = stageExchangeProductsWorkflow;
}
