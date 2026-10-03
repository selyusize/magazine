import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { DeleteRedirectCommand } from "./command";
import { deleteRedirectWorkflow } from "./workflow";

/** Удаляет правило — DELETE /admin/redirects/:id. Автоматическое правило вернётся при следующей смене handle. */
@Injectable()
export class DeleteRedirectHandler extends AbstractCommandHandler<
  DeleteRedirectCommand,
  void
> {
  protected readonly workflow = deleteRedirectWorkflow;
}
