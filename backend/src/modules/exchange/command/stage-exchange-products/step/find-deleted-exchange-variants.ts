import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/** Только чтение: варианты карточек товаров, которые поставщик пометил удалёнными. */
export const findDeletedExchangeVariantsStep = createStep(
  "find-deleted-exchange-variants",
  async (input: { supplier_id: string; external_ids: string[] }, { container }) => {
    if (!input.external_ids.length) return new StepResponse<string[]>([]);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data: rows } = await query.graph({
      entity: "exchange_product",
      fields: ["product_id"],
      filters: { supplier_id: input.supplier_id, external_id: input.external_ids, is_deleted: true },
    });
    const productIds = rows.flatMap((row) => (row.product_id ? [row.product_id] : []));
    if (!productIds.length) return new StepResponse<string[]>([]);

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id"],
      filters: { product_id: productIds },
    });
    return new StepResponse<string[]>(variants.map((variant) => variant.id));
  },
);
