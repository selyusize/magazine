import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { ApplyExchangeProductContentCommand } from "./command";
import type { AppliedExchangeContentDTO } from "./dto";
import { applyExchangeProductContentWorkflow } from "./workflow";

/** Применяет данные выгрузки к карточкам поставщика-владельца. */
@Injectable()
export class ApplyExchangeProductContentHandler extends AbstractCommandHandler<
  ApplyExchangeProductContentCommand,
  AppliedExchangeContentDTO
> {
  protected readonly workflow = applyExchangeProductContentWorkflow;
}
