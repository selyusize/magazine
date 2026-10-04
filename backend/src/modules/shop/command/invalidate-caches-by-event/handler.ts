import { Injectable } from "@shared/container";
import type { CommandHandler } from "@shared/contract/command-handler";
import { CacheInvalidator } from "@shared/service/cache-invalidation/cache-invalidator";

import { GetStorefrontRevalidationTargetsByEventFetcher } from "../../query/get-storefront-revalidation-targets-by-event/fetcher";
import { QueueStorefrontRevalidationsHandler } from "../queue-storefront-revalidations/handler";
import type { InvalidateCachesByEventCommand } from "./command";

/**
 * Изменение сущности → её кэш удалён везде: теги кэша бэкенда сбрасываются сразу, теги витрин её магазина(ов)
 * встают в очередь ревалидации (дебаунс, вебхук — `send-storefront-revalidation`). Без workflow: сброс кэша не
 * откатывают, а запись очереди — команда со своим workflow.
 */
@Injectable()
export class InvalidateCachesByEventHandler implements CommandHandler<InvalidateCachesByEventCommand, void> {
  constructor(
    private readonly backend: CacheInvalidator,
    private readonly targets: GetStorefrontRevalidationTargetsByEventFetcher,
    private readonly queue: QueueStorefrontRevalidationsHandler,
  ) {}

  async handle(command: InvalidateCachesByEventCommand): Promise<void> {
    await this.backend.invalidate(command.event, command.data);
    const batches = await this.targets.fetch(command);
    if (batches.length) await this.queue.handle({ batches });
  }
}
