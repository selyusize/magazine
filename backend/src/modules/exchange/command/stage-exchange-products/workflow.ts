import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

import { zeroStaleOffersForSupplierWorkflow } from "@domain/supplier/command/zero-stale-offers-for-supplier/workflow";

import { applyExchangeProductContentWorkflow } from "../apply-exchange-product-content/workflow";
import { publishExchangeProductsWorkflow } from "../publish-exchange-products/workflow";
import type { StageExchangeProductsCommand } from "./command";
import type { StagedExchangeProductsDTO } from "./dto";
import { findDeletedExchangeVariantsStep } from "./step/find-deleted-exchange-variants";
import { saveExchangeProductsStep } from "./step/save-exchange-products";

/**
 * Пачка `import.xml` одной транзакцией: данные товаров → содержимое карточек владельца → остаток 0 у удалённых →
 * публикация готовых. Упало — откатилось всё, включая хэши: повтор пачки применит её заново.
 */
export const stageExchangeProductsWorkflow = createWorkflow(
  "stage-exchange-products",
  (command: StageExchangeProductsCommand) => {
    const saved = saveExchangeProductsStep(
      transform(command, (command) => ({ supplier_id: command.supplier_id, rows: command.products })),
    );
    const changed = transform({ saved, command }, ({ saved, command }) => ({
      supplier_id: command.supplier_id,
      package_dir: command.package_dir,
      publish: command.publish,
      external_ids: saved.changed,
    }));

    const content = when("apply-staged-content", changed, (changed) => changed.external_ids.length > 0).then(() =>
      applyExchangeProductContentWorkflow.runAsStep({ input: changed }),
    );
    const deleted = findDeletedExchangeVariantsStep(changed);
    when("zero-deleted-exchange-offers", deleted, (deleted) => deleted.length > 0).then(() => {
      zeroStaleOffersForSupplierWorkflow.runAsStep({
        input: transform({ command, deleted }, ({ command, deleted }) => ({
          supplier_id: command.supplier_id,
          variant_ids: deleted,
        })),
      });
    });
    when("publish-staged-products", changed, (changed) => changed.external_ids.length > 0).then(() => {
      publishExchangeProductsWorkflow.runAsStep({ input: changed });
    });

    return new WorkflowResponse(
      transform({ saved, command, content }, ({ saved, command, content }): StagedExchangeProductsDTO => ({
        created: saved.created,
        updated: saved.updated,
        skipped: command.products.length - saved.changed.length,
        errors: content?.errors ?? [],
      })),
    );
  },
);
