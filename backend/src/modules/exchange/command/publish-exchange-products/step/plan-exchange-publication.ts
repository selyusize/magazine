import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { Container } from "@container/index";
import { texts } from "@shared/query/narrow";
import { FindPublishProblemsByProductIdsFetcher } from "@domain/catalog/query/find-publish-problems-by-product-ids/fetcher";
import type { PublishRequirement } from "@domain/catalog/service/publish-requirements";

import type { PublishExchangeProductsCommand } from "../command";

/** Причины очереди «требует разбора» из недостающих для публикации полей. */
const PROBLEMS: Partial<Record<PublishRequirement, string>> = {
  main_category: "unmapped_group",
  image: "no_image",
  price: "no_price",
  offer: "no_offer",
};

export type PublicationPlan = {
  publish: string[];
  problems: { id: string; problems: string[]; needs_review: boolean }[];
  needs_review: number;
};

/**
 * Только чтение: чего не хватает карточкам владельца (проверка публикации каталога, этап 2.6) → причины очереди
 * и список готовых черновиков к публикации. Опубликованные и черновики с причинами не трогает.
 */
export const planExchangePublicationStep = createStep(
  "plan-exchange-publication",
  async (command: PublishExchangeProductsCommand, { container }) => {
    const plan: PublicationPlan = { publish: [], problems: [], needs_review: 0 };
    if (!command.external_ids.length) return new StepResponse(plan);

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: rows } = await query.graph({
      entity: "exchange_product",
      fields: ["id", "product_id", "problems"],
      filters: { supplier_id: command.supplier_id, external_id: command.external_ids, is_owner: true },
    });
    const linked = rows.flatMap((row) =>
      row.product_id ? [{ id: row.id, product_id: row.product_id, problems: texts(row.problems) }] : [],
    );
    if (!linked.length) return new StepResponse(plan);

    const productIds = linked.map((row) => row.product_id);
    const [missing, { data: products }] = await Promise.all([
      Container.from(container)
        .get(FindPublishProblemsByProductIdsFetcher)
        .fetch({ product_ids: productIds, include_drafts: true }),
      query.graph({ entity: "product", fields: ["id", "status"], filters: { id: productIds } }),
    ]);
    const missingOf = new Map(missing.map((problem) => [problem.product_id, problem.missing]));
    const statusOf = new Map(products.map((product) => [product.id, product.status]));

    for (const row of linked) {
      const problems = (missingOf.get(row.product_id) ?? []).flatMap((requirement) =>
        PROBLEMS[requirement] ? [PROBLEMS[requirement]] : [],
      );
      if (problems.length) plan.needs_review++;
      if (JSON.stringify(problems) !== JSON.stringify(row.problems))
        plan.problems.push({ id: row.id, problems, needs_review: problems.length > 0 });
      if (command.publish && !problems.length && statusOf.get(row.product_id) === ProductStatus.DRAFT)
        plan.publish.push(row.product_id);
    }
    return new StepResponse(plan);
  },
);
