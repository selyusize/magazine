import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { Container } from "@container/index";
import { SendStorefrontRevalidationHandler } from "@domain/shop/command/send-storefront-revalidation/handler";
import { STOREFRONT_REVALIDATION_QUEUED } from "@domain/shop/service/storefront-revalidation";

/** Срок пачки ревалидации подошёл (событие с задержкой) — вебхук витрине магазина. */
export default async function shopStorefrontRevalidationQueued({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await Container.from(container).get(SendStorefrontRevalidationHandler).handle({ id: data.id });
}

export const config: SubscriberConfig = { event: STOREFRONT_REVALIDATION_QUEUED };
