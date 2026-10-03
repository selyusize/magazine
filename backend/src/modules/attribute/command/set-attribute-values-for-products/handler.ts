import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SetAttributeValuesForProductsCommand } from "./command";
import type { SavedAttributeValuesDTO } from "./dto";
import { setAttributeValuesForProductsWorkflow } from "./workflow";

/** Характеристики пачки товаров одним workflow — для импорта поставщика. */
@Injectable()
export class SetAttributeValuesForProductsHandler extends AbstractCommandHandler<
  SetAttributeValuesForProductsCommand,
  SavedAttributeValuesDTO
> {
  protected readonly workflow = setAttributeValuesForProductsWorkflow;
}
