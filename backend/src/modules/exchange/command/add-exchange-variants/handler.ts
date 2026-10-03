import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { AddExchangeVariantsCommand } from "./command";
import type { AddedExchangeVariantsDTO } from "./dto";
import { addExchangeVariantsWorkflow } from "./workflow";

/** Добавляет карточке поставщика-владельца новые варианты из выгрузки. */
@Injectable()
export class AddExchangeVariantsHandler extends AbstractCommandHandler<
  AddExchangeVariantsCommand,
  AddedExchangeVariantsDTO
> {
  protected readonly workflow = addExchangeVariantsWorkflow;
}
