import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { EnsureBrandsByNamesCommand } from "./command";
import type { BrandByNameDTO } from "./dto";
import { ensureBrandsByNamesWorkflow } from "./workflow";

/** Бренды для импорта: существующие по названию или синониму, недостающие — новые со slug. */
@Injectable()
export class EnsureBrandsByNamesHandler extends AbstractCommandHandler<
  EnsureBrandsByNamesCommand,
  BrandByNameDTO[]
> {
  protected readonly workflow = ensureBrandsByNamesWorkflow;
}
