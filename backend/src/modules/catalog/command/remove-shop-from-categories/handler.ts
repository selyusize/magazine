import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { RemoveShopFromCategoriesCommand } from "./command";
import { removeShopFromCategoriesWorkflow } from "./workflow";

/** Снимает связи категорий с магазином (откат `assign-shop-to-categories` из хука). */
@Injectable()
export class RemoveShopFromCategoriesHandler extends AbstractCommandHandler<RemoveShopFromCategoriesCommand, void> {
  protected readonly workflow = removeShopFromCategoriesWorkflow;
}
