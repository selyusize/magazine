import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { CreateInitialStoreDataCommand } from "./command";
import type { InitialStoreDataDTO } from "./dto";
import { createInitialStoreDataWorkflow } from "./workflow";

/** Общая настройка сети под РФ при первом `db:migrate` — вызывается из src/migration-scripts/initial-data-seed.ts. */
@Injectable()
export class CreateInitialStoreDataHandler extends AbstractCommandHandler<
  CreateInitialStoreDataCommand,
  InitialStoreDataDTO
> {
  protected readonly workflow = createInitialStoreDataWorkflow;
}
