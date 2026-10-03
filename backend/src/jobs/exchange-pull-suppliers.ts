import type { MedusaContainer } from "@medusajs/framework/types";

import { Container } from "@container/index";
import { PullDueSuppliersHandler } from "@domain/exchange/command/pull-due-suppliers/handler";

/** Pull-поставщики: скачать выгрузку, если подошёл интервал из их настроек. */
export default async function exchangePullSuppliers(container: MedusaContainer) {
  await Container.from(container).get(PullDueSuppliersHandler).handle({ now: new Date().toISOString() });
}

export const config = { name: "exchange-pull-suppliers", schedule: "*/5 * * * *" };
