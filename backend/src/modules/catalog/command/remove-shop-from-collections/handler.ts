import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { RemoveShopFromCollectionsCommand } from "./command";
import { removeShopFromCollectionsWorkflow } from "./workflow";

/** Снимает связи коллекций с магазином (откат `assign-shop-to-collections` из хука). */
@Injectable()
export class RemoveShopFromCollectionsHandler extends AbstractCommandHandler<RemoveShopFromCollectionsCommand, void> {
  protected readonly workflow = removeShopFromCollectionsWorkflow;
}
