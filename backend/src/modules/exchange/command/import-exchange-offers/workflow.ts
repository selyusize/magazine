import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createProductsWorkflow, updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";

import { upsertSupplierOffersWorkflow } from "@domain/supplier/command/upsert-supplier-offers/workflow";

import { applyExchangeProductContentWorkflow } from "../apply-exchange-product-content/workflow";
import { publishExchangeProductsWorkflow } from "../publish-exchange-products/workflow";
import type { ImportExchangeOffersCommand } from "./command";
import type { ImportedExchangeOffersDTO } from "./dto";
import { findSupplierShopStep } from "../../step/find-supplier-shop";
import { linkExchangeProductsStep } from "./step/link-exchange-products";
import { loadExchangeOffersStateStep } from "./step/load-exchange-offers-state";
import { planExchangeOffersStep } from "./step/plan-exchange-offers";
import { resolvePlannedOffersStep } from "./step/resolve-planned-offers";

/**
 * Пачка предложений одной транзакцией: новые карточки-черновики с вариантами в канале магазина поставщика (Medusa),
 * склейка с карточками других поставщиков только этого магазина, связи товаров поставщика, предложения и остатки
 * (модуль supplier), розничные цены карточек владельца, содержимое новых карточек и публикация готовых. Повтор той же пачки ничего не создаёт: карточки и предложения находятся по прежним связям.
 */
export const importExchangeOffersWorkflow = createWorkflow(
  "import-exchange-offers",
  (command: ImportExchangeOffersCommand) => {
    const shop = findSupplierShopStep(transform(command, (command) => ({ supplier_id: command.supplier_id })));
    const state = loadExchangeOffersStateStep({ command, shop });
    const plan = planExchangeOffersStep({ command, state });

    const products = when("create-exchange-products", plan, (plan) => plan.create.length > 0).then(() =>
      createProductsWorkflow.runAsStep({
        input: transform(plan, (plan) => ({ products: plan.create.map((item) => item.product) })),
      }),
    );
    const resolved = resolvePlannedOffersStep(
      transform({ command, plan, products }, ({ command, plan, products }) => ({
        supplier_id: command.supplier_id,
        synced_at: command.synced_at,
        plan,
        created_product_ids: (products ?? []).map((product) => product.id),
      })),
    );
    linkExchangeProductsStep(transform(resolved, (resolved) => resolved.links));
    const offers = upsertSupplierOffersWorkflow.runAsStep({
      input: transform(resolved, (resolved) => ({ offers: resolved.offers })),
    });
    when("update-exchange-prices", { plan, state }, ({ plan }) => plan.prices.length > 0).then(() => {
      updateProductVariantsWorkflow.runAsStep({
        input: transform({ plan, state }, ({ plan, state }) => ({
          product_variants: plan.prices.map((price) => ({
            id: price.variant_id,
            prices: [{ amount: price.amount, currency_code: state.currency_code }],
          })),
        })),
      });
    });

    const created = transform({ command, plan }, ({ command, plan }) => ({
      supplier_id: command.supplier_id,
      package_dir: command.package_dir,
      external_ids: plan.create.map((item) => item.external_id),
    }));
    const content = when("apply-created-content", created, (created) => created.external_ids.length > 0).then(() =>
      applyExchangeProductContentWorkflow.runAsStep({ input: created }),
    );
    publishExchangeProductsWorkflow.runAsStep({
      input: transform(command, (command) => ({
        supplier_id: command.supplier_id,
        publish: command.publish,
        external_ids: [...new Set(command.offers.map((offer) => offer.product_external_id))],
      })),
    });

    return new WorkflowResponse(
      transform({ plan, offers, content }, ({ plan, offers, content }): ImportedExchangeOffersDTO => ({
        created: plan.create.map((item) => item.external_id),
        linked: plan.links.filter((link) => !link.is_owner).map((link) => link.external_id),
        offers,
        prices: plan.prices.length,
        deferred: plan.deferred,
        errors: [...plan.errors, ...(content?.errors ?? [])],
      })),
    );
  },
);
