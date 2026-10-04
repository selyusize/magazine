import type { MedusaContainer } from "@medusajs/framework/types";

import { Container } from "@container/index";
import { PruneStorefrontRevalidationsHandler } from "@domain/shop/command/prune-storefront-revalidations/handler";

/** Журнал отправок ревалидации витрин — только за последние дни. */
export default async function shopPruneStorefrontRevalidations(container: MedusaContainer) {
  await Container.from(container).get(PruneStorefrontRevalidationsHandler).handle({ now: new Date().toISOString() });
}

export const config = { name: "shop-prune-storefront-revalidations", schedule: "17 4 * * *" };
