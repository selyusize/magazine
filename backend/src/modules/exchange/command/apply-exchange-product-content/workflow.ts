import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

import { ensureBrandsByNamesWorkflow } from "@domain/brand/command/ensure-brands-by-names/workflow";
import { setAttributeValuesForProductsWorkflow } from "@domain/attribute/command/set-attribute-values-for-products/workflow";
import { setCatalogForProductsWorkflow } from "@domain/catalog/command/set-catalog-for-products/workflow";

import { ensureExchangeImagesStep } from "../../step/ensure-exchange-images";
import { findSupplierShopStep } from "../../step/find-supplier-shop";
import type { ApplyExchangeProductContentCommand } from "./command";
import type { AppliedExchangeContentDTO } from "./dto";
import { loadExchangeContentStep } from "./step/load-exchange-content";
import { planExchangeContentStep } from "./step/plan-exchange-content";
import { saveExchangeSnapshotsStep } from "./step/save-exchange-snapshots";

/**
 * Содержимое карточек из выгрузки. Каждый модуль пишет своё своим workflow (товар — Medusa, бренды магазина
 * поставщика — brand, связь с брендом и основная категория — catalog, характеристики — attribute), всё в одной
 * транзакции workflow: упало — откатилось всё.
 */
export const applyExchangeProductContentWorkflow = createWorkflow(
  "apply-exchange-product-content",
  (command: ApplyExchangeProductContentCommand) => {
    const loaded = loadExchangeContentStep(command);
    const images = ensureExchangeImagesStep(
      transform({ command, loaded }, ({ command, loaded }) => ({
        supplier_id: command.supplier_id,
        package_dir: command.package_dir,
        sources: loaded.rows.flatMap((row) => row.data.images),
      })),
    );
    const shop = findSupplierShopStep(transform(command, (command) => ({ supplier_id: command.supplier_id })));
    const brands = ensureBrandsByNamesWorkflow.runAsStep({
      input: transform({ loaded, shop }, ({ loaded, shop }) => ({
        shop_id: shop.shop_id,
        names: loaded.rows.flatMap((row) => (row.data.brand ? [row.data.brand] : [])),
      })),
    });
    const plan = planExchangeContentStep({ loaded, images, brands });

    when("update-exchange-products", plan, (plan) => plan.products.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({ input: transform(plan, (plan) => ({ products: plan.products })) });
    });
    setCatalogForProductsWorkflow.runAsStep({ input: transform(plan, (plan) => ({ items: plan.catalog })) });
    const attributes = setAttributeValuesForProductsWorkflow.runAsStep({
      input: transform(plan, (plan) => ({ items: plan.attributes })),
    });
    saveExchangeSnapshotsStep(transform(plan, (plan) => plan.snapshots));

    return new WorkflowResponse(
      transform({ plan, images, attributes, loaded }, ({ plan, images, attributes, loaded }): AppliedExchangeContentDTO => {
        const externalIds = new Map(loaded.rows.map((row) => [row.product_id, row.external_id]));
        return {
          updated: plan.products.length,
          errors: [
            ...images.failed.map((failure) => ({ external_id: null, message: `Картинка ${failure.source}: ${failure.message}` })),
            ...attributes.errors.map((error) => ({
              external_id: externalIds.get(error.product_id) ?? null,
              message: error.message,
            })),
          ],
        };
      }),
    );
  },
);
