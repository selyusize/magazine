import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { RequeueStaleStorefrontRevalidationsCommand } from "./command";
import type { RequeuedStorefrontRevalidationsDTO } from "./dto";
import { requeueStaleStorefrontRevalidationsWorkflow } from "./workflow";

/** Страховка таймеров ревалидации — job `shop-requeue-storefront-revalidations`. */
@Injectable()
export class RequeueStaleStorefrontRevalidationsHandler extends AbstractCommandHandler<
  RequeueStaleStorefrontRevalidationsCommand,
  RequeuedStorefrontRevalidationsDTO
> {
  protected readonly workflow = requeueStaleStorefrontRevalidationsWorkflow;
}
