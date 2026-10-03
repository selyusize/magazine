import { ProductStatus } from "@medusajs/framework/utils";
import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

import type { PublishExchangeProductsCommand } from "./command";
import type { PublishedExchangeProductsDTO } from "./dto";
import { planExchangePublicationStep } from "./step/plan-exchange-publication";
import { saveExchangeProblemsStep } from "./step/save-exchange-problems";

/** Публикация — обычным workflow Medusa: хук проверки публикации (этап 2.6) срабатывает и здесь. */
export const publishExchangeProductsWorkflow = createWorkflow(
  "publish-exchange-products",
  (command: PublishExchangeProductsCommand) => {
    const plan = planExchangePublicationStep(command);
    when("publish-ready-exchange-products", plan, (plan) => plan.publish.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({
        input: transform(plan, (plan) => ({
          selector: { id: plan.publish },
          update: { status: ProductStatus.PUBLISHED },
        })),
      });
    });
    saveExchangeProblemsStep(transform(plan, (plan) => plan.problems));
    return new WorkflowResponse(
      transform(plan, (plan): PublishedExchangeProductsDTO => ({
        published: plan.publish.length,
        needs_review: plan.needs_review,
      })),
    );
  },
);
