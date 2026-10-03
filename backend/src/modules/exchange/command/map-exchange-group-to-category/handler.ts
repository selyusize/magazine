import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { MapExchangeGroupToCategoryCommand } from "./command";
import type { MappedExchangeGroupDTO } from "./dto";
import { mapExchangeGroupToCategoryWorkflow } from "./workflow";

/** Сопоставляет группу поставщика с категорией магазина. */
@Injectable()
export class MapExchangeGroupToCategoryHandler extends AbstractCommandHandler<
  MapExchangeGroupToCategoryCommand,
  MappedExchangeGroupDTO
> {
  protected readonly workflow = mapExchangeGroupToCategoryWorkflow;
}
