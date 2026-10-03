import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { DeleteFilterPagesByCategoryIdCommand } from "./command";
import { deleteFilterPagesByCategoryIdWorkflow } from "./workflow";

/** Удаляет посадочные удалённой категории. */
@Injectable()
export class DeleteFilterPagesByCategoryIdHandler extends AbstractCommandHandler<
  DeleteFilterPagesByCategoryIdCommand,
  void
> {
  protected readonly workflow = deleteFilterPagesByCategoryIdWorkflow;
}
