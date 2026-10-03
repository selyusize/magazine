import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { ProcessImportRunHandler } from "@domain/exchange/command/process-import-run/handler";

/** Пакет поставщика в очереди → разбор и запись в worker. Повтор события безопасен: запуск продолжится с места. */
export default async function exchangeImportRunQueued({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container).get(ProcessImportRunHandler).handle({ id: data.id });
}

export const config: SubscriberConfig = { event: "import_run.queued" };
