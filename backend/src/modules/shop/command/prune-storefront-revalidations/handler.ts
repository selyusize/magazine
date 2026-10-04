import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { PruneStorefrontRevalidationsCommand } from "./command";
import type { PrunedStorefrontRevalidationsDTO } from "./dto";
import { pruneStorefrontRevalidationsWorkflow } from "./workflow";

/** Чистка журнала ревалидации — job `shop-prune-storefront-revalidations`. */
@Injectable()
export class PruneStorefrontRevalidationsHandler extends AbstractCommandHandler<
  PruneStorefrontRevalidationsCommand,
  PrunedStorefrontRevalidationsDTO
> {
  protected readonly workflow = pruneStorefrontRevalidationsWorkflow;
}
