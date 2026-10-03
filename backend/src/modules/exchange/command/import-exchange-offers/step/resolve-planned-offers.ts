import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import type { UpsertSupplierOffersCommand } from "@domain/supplier/command/upsert-supplier-offers/command";

import type { OffersImportPlan } from "../../../service/offers-import-plan";

/**
 * Только чтение: предложения новых карточек получают id созданных вариантов (по `external_id` товара и названию
 * варианта — оно уникально внутри карточки), связи — id карточек.
 */
export const resolvePlannedOffersStep = createStep(
  "resolve-planned-offers",
  async (
    input: { supplier_id: string; synced_at: string; plan: OffersImportPlan; created_product_ids: string[] },
    { container },
  ) => {
    const productByExternalId = new Map(
      input.plan.create.map((item, index) => [item.external_id, input.created_product_ids[index]]),
    );
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const variants = input.created_product_ids.length
      ? (
          await query.graph({
            entity: "product_variant",
            fields: ["id", "title", "product_id"],
            filters: { product_id: input.created_product_ids },
          })
        ).data
      : [];
    const variantOf = new Map(
      variants.map((variant) => [`${variant.product_id}\u0000${variant.title}`, variant.id] as const),
    );

    const offers: UpsertSupplierOffersCommand["offers"] = input.plan.offers.flatMap((offer) => {
      const variantId =
        "variant_id" in offer.variant
          ? offer.variant.variant_id
          : variantOf.get(`${productByExternalId.get(offer.variant.product_external_id)}\u0000${offer.variant.title}`);
      return variantId
        ? [
            {
              supplier_id: input.supplier_id,
              variant_id: variantId,
              external_id: offer.external_id,
              sku: offer.sku,
              barcode: offer.barcode,
              purchase_price: offer.purchase_price,
              quantity: offer.quantity,
              synced_at: input.synced_at,
            },
          ]
        : [];
    });
    const links = input.plan.links.flatMap((link) => {
      const productId = link.product_id ?? productByExternalId.get(link.external_id);
      return productId ? [{ row_id: link.row_id, product_id: productId, is_owner: link.is_owner }] : [];
    });
    return new StepResponse({ offers, links });
  },
);
