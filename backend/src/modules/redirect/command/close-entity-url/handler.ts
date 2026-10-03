import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { CloseEntityURLCommand } from "./command";
import { closeEntityURLWorkflow } from "./workflow";

/** Удалённый товар, категория или коллекция: последний путь и все старые пути ведут на 410. */
@Injectable()
export class CloseEntityURLHandler extends AbstractCommandHandler<
  CloseEntityURLCommand,
  void
> {
  protected readonly workflow = closeEntityURLWorkflow;
}
