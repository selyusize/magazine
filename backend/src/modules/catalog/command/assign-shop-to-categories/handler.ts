import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { AssignShopToCategoriesCommand } from "./command";
import type { AssignedCategoryShopDTO } from "./dto";
import { assignShopToCategoriesWorkflow } from "./workflow";

/** Связывает новые категории с магазином родителя. */
@Injectable()
export class AssignShopToCategoriesHandler extends AbstractCommandHandler<
  AssignShopToCategoriesCommand,
  AssignedCategoryShopDTO[]
> {
  protected readonly workflow = assignShopToCategoriesWorkflow;
}
