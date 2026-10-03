import type { MedusaContainer } from "@medusajs/framework/types";

import { REDIRECT_MODULE } from "@domain/redirect";
import type { RedirectModuleService } from "@domain/redirect/service/redirect-module-service";

/** Путь, который модуль redirect запомнил за сущностью. Подписчик на `*.created` асинхронный: смена handle даёт 301, только когда путь уже записан. */
export async function trackedPath(
  container: MedusaContainer,
  entityId: string,
): Promise<string | null> {
  const [entityPath] = await container
    .resolve<RedirectModuleService>(REDIRECT_MODULE)
    .listEntityPaths({ entity_id: entityId });
  return entityPath?.path ?? null;
}
