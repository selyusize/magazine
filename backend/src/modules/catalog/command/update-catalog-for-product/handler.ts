import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { UpdateCatalogForProductCommand } from "./command";
import type { UpdatedProductCatalogDTO } from "./dto";
import { updateCatalogForProductWorkflow } from "./workflow";

/** Меняет бренд и основную категорию товара. */
@Injectable()
export class UpdateCatalogForProductHandler extends AbstractCommandHandler<
  UpdateCatalogForProductCommand,
  UpdatedProductCatalogDTO
> {
  protected readonly workflow = updateCatalogForProductWorkflow;
}
