import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import {
  createAndLinkProductOptionsToProductWorkflow,
  createProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows";

import { upsertSupplierOffersWorkflow } from "@domain/supplier/command/upsert-supplier-offers/workflow";

import type { AddExchangeVariantsCommand } from "./command";
import type { AddedExchangeVariantsDTO } from "./dto";
import { planExchangeVariantsStep } from "./step/plan-exchange-variants";

/**
 * У поставщика появилась новая характеристика товара (размер, цвет): значения опций карточки → вариант с ценой
 * (core-flows Medusa) → предложение и остаток. Всё — одной транзакцией по карточке.
 */
export const addExchangeVariantsWorkflow = createWorkflow(
  "add-exchange-variants",
  (command: AddExchangeVariantsCommand) => {
    const plan = planExchangeVariantsStep(command);

    when("add-exchange-option-values", plan, (plan) => plan.option_values.length > 0).then(() => {
      createAndLinkProductOptionsToProductWorkflow.runAsStep({
        input: transform({ plan, command }, ({ plan, command }) => ({
          product_id: command.product_id,
          update: plan.option_values,
        })),
      });
    });
    const variants = when("create-exchange-variants", plan, (plan) => plan.variants.length > 0).then(() =>
      createProductVariantsWorkflow.runAsStep({
        input: transform({ plan, command }, ({ plan, command }) => ({
          product_variants: plan.variants.map((variant) => ({
            product_id: command.product_id,
            title: variant.title,
            options: variant.options,
            manage_inventory: true,
            prices: variant.prices,
          })),
        })),
      }),
    );
    upsertSupplierOffersWorkflow.runAsStep({
      input: transform({ plan, command, variants }, ({ plan, command, variants }) => {
        const byTitle = new Map((variants ?? []).map((variant) => [variant.title, variant.id] as const));
        return {
          offers: plan.variants.flatMap((planned) => {
            const offer = command.offers.find((item) => item.external_id === planned.external_id);
            const variantId = byTitle.get(planned.title);
            return offer && variantId
              ? [
                  {
                    supplier_id: command.supplier_id,
                    variant_id: variantId,
                    external_id: offer.external_id,
                    sku: offer.sku,
                    barcode: offer.barcode,
                    purchase_price: planned.purchase_price,
                    quantity: offer.deleted ? 0 : offer.quantity,
                    synced_at: command.synced_at,
                  },
                ]
              : [];
          }),
        };
      }),
    });

    return new WorkflowResponse(
      transform({ plan, variants }, ({ plan, variants }): AddedExchangeVariantsDTO => ({
        created: (variants ?? []).length,
        errors: plan.errors,
      })),
    );
  },
);
