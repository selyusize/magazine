import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { ImportRedirectsCommand } from "./command";
import type { ImportedRedirectsDTO } from "./dto";
import { importRedirectsWorkflow } from "./workflow";

/** Импорт правил из CSV — POST /admin/redirects/import. */
@Injectable()
export class ImportRedirectsHandler extends AbstractCommandHandler<
  ImportRedirectsCommand,
  ImportedRedirectsDTO
> {
  protected readonly workflow = importRedirectsWorkflow;
}
