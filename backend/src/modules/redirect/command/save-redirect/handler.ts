import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SaveRedirectCommand } from "./command";
import type { SavedRedirectDTO } from "./dto";
import { saveRedirectWorkflow } from "./workflow";

/** Создаёт или перезаписывает ручное правило — POST /admin/redirects. */
@Injectable()
export class SaveRedirectHandler extends AbstractCommandHandler<
  SaveRedirectCommand,
  SavedRedirectDTO
> {
  protected readonly workflow = saveRedirectWorkflow;
}
