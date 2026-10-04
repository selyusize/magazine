import type { MedusaContainer } from "@medusajs/framework/types";

import { Container } from "@container/index";
import { RequeueStaleStorefrontRevalidationsHandler } from "@domain/shop/command/requeue-stale-storefront-revalidations/handler";

/** Пачки ревалидации с потерянным таймером (событие не дошло, упал worker) — снова в отправку. */
export default async function shopRequeueStorefrontRevalidations(container: MedusaContainer) {
  await Container.from(container)
    .get(RequeueStaleStorefrontRevalidationsHandler)
    .handle({ now: new Date().toISOString() });
}

export const config = { name: "shop-requeue-storefront-revalidations", schedule: "* * * * *" };
