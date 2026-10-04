import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { AssignShopToCollectionsCommand } from "./command";
import type { AssignedCollectionShopDTO } from "./dto";
import { assignShopToCollectionsWorkflow } from "./workflow";

/** Связывает коллекции с магазином; уже связанные с ним — без изменений. */
@Injectable()
export class AssignShopToCollectionsHandler extends AbstractCommandHandler<
  AssignShopToCollectionsCommand,
  AssignedCollectionShopDTO[]
> {
  protected readonly workflow = assignShopToCollectionsWorkflow;
}
