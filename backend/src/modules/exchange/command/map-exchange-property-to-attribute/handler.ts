import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { MapExchangePropertyToAttributeCommand } from "./command";
import type { MappedExchangePropertyDTO } from "./dto";
import { mapExchangePropertyToAttributeWorkflow } from "./workflow";

/** Сопоставляет свойство поставщика с характеристикой магазина. */
@Injectable()
export class MapExchangePropertyToAttributeHandler extends AbstractCommandHandler<
  MapExchangePropertyToAttributeCommand,
  MappedExchangePropertyDTO
> {
  protected readonly workflow = mapExchangePropertyToAttributeWorkflow;
}
