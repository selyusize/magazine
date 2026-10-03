import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SetAttributeValuesForProductCommand } from "./command";
import type { SavedAttributeValueDTO } from "./dto";
import { setAttributeValuesForProductWorkflow } from "./workflow";

/** Заменяет значения характеристик товара или его варианта. */
@Injectable()
export class SetAttributeValuesForProductHandler extends AbstractCommandHandler<
  SetAttributeValuesForProductCommand,
  SavedAttributeValueDTO[]
> {
  protected readonly workflow = setAttributeValuesForProductWorkflow;
}
