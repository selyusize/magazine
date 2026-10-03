import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  emitEventStep,
  releaseLockStep,
} from "@medusajs/medusa/core-flows";

import type { EnsureBrandsByNamesCommand } from "./command";
import { createMissingBrandsStep } from "./step/create-missing-brands";

/** Та же блокировка, что у CRUD брендов: иначе импорт и админка одновременно выберут один handle. */
const LOCK_KEY = "crud-handle:brand";

/** Бренды из выгрузки: новые получают страницу `/brands/{handle}` — событие `brand.created` для редиректов. */
export const ensureBrandsByNamesWorkflow = createWorkflow(
  "ensure-brands-by-names",
  (command: EnsureBrandsByNamesCommand) => {
    acquireLockStep({ key: LOCK_KEY, timeout: 30, ttl: 60 });
    const brands = createMissingBrandsStep(command);
    emitEventStep({
      eventName: "brand.created",
      data: transform(brands, (brands) =>
        brands.filter((brand) => brand.created).map((brand) => ({ id: brand.brand_id })),
      ),
    });
    releaseLockStep({ key: LOCK_KEY });
    return new WorkflowResponse(brands);
  },
);
