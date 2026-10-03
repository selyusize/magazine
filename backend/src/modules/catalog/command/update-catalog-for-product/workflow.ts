import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows";

import {
  PRODUCT_CATALOG_FIELDS,
  toProductCatalogDTO,
} from "../../query/get-catalog-by-product-id/fetcher";
import type { UpdateCatalogForProductCommand } from "./command";
import type { UpdatedProductCatalogDTO } from "./dto";
import { setProductBrandStep } from "./step/set-product-brand";
import { setProductMainCategoryStep } from "./step/set-product-main-category";
import { validateProductCatalogStep } from "./step/validate-product-catalog";

/**
 * Бренд и основная категория — SEO-значимые данные карточки (крошки, canonical, фильтры), поэтому событие
 * `product.updated`: его ждут поисковый индекс и ревалидация витрины (этап 9).
 */
export const updateCatalogForProductWorkflow = createWorkflow(
  "update-catalog-for-product",
  (command: UpdateCatalogForProductCommand) => {
    const change = validateProductCatalogStep(command);
    setProductBrandStep(change);
    setProductMainCategoryStep(change);
    emitEventStep({
      eventName: "product.updated",
      data: transform(command, (command) => ({ id: command.product_id })),
    });

    const { data } = useQueryGraphStep({
      entity: "product",
      fields: PRODUCT_CATALOG_FIELDS,
      filters: transform(command, (command) => ({ id: command.product_id })),
    });
    return new WorkflowResponse(
      transform(data, (data): UpdatedProductCatalogDTO =>
        toProductCatalogDTO(
          data[0] as Record<string, unknown> & { id: string },
        ),
      ),
    );
  },
);
