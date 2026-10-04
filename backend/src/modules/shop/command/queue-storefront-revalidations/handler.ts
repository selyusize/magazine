import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { QueueStorefrontRevalidationsCommand } from "./command";
import type { QueuedStorefrontRevalidationsDTO } from "./dto";
import { queueStorefrontRevalidationsWorkflow } from "./workflow";

/** Теги витрин — в очередь ревалидации: событие изменения (`invalidate-caches-by-event`) и кнопка в админке. */
@Injectable()
export class QueueStorefrontRevalidationsHandler extends AbstractCommandHandler<
  QueueStorefrontRevalidationsCommand,
  QueuedStorefrontRevalidationsDTO
> {
  protected readonly workflow = queueStorefrontRevalidationsWorkflow;
}
