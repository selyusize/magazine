import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { SendStorefrontRevalidationCommand } from "./command";
import { sendStorefrontRevalidationWorkflow } from "./workflow";

/** Срок пачки подошёл (событие с задержкой) — вебхук витрине магазина, итог в журнал, неудача — повтор. */
@Injectable()
export class SendStorefrontRevalidationHandler extends AbstractCommandHandler<
  SendStorefrontRevalidationCommand,
  void
> {
  protected readonly workflow = sendStorefrontRevalidationWorkflow;
}
