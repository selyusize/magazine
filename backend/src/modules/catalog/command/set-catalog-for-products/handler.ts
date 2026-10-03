import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SetCatalogForProductsCommand } from "./command";
import { setCatalogForProductsWorkflow } from "./workflow";

/** Бренд и основная категория пачки товаров одним workflow — для импорта поставщика. */
@Injectable()
export class SetCatalogForProductsHandler extends AbstractCommandHandler<SetCatalogForProductsCommand, void> {
  protected readonly workflow = setCatalogForProductsWorkflow;
}
