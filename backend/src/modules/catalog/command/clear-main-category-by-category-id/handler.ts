import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { ClearMainCategoryByCategoryIdCommand } from "./command";
import { clearMainCategoryByCategoryIdWorkflow } from "./workflow";

/** Снимает удалённую категорию с товаров, у которых она была основной. */
@Injectable()
export class ClearMainCategoryByCategoryIdHandler extends AbstractCommandHandler<
  ClearMainCategoryByCategoryIdCommand,
  void
> {
  protected readonly workflow = clearMainCategoryByCategoryIdWorkflow;
}
