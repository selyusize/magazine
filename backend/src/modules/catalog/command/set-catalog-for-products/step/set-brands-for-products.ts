import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { BRAND_MODULE } from "../../../../brand";
import type { CatalogForProductsPlan } from "./plan-catalog-for-products";

const linkOf = (product_id: string, brand_id: string) => ({
  [Modules.PRODUCT]: { product_id },
  [BRAND_MODULE]: { brand_id },
});

/** Переставляет связи `product ↔ brand` пачкой; откат возвращает прежние бренды. */
export const setBrandsForProductsStep = createStep(
  "set-brands-for-products",
  async (changes: CatalogForProductsPlan["brands"], { container }) => {
    if (!changes.length) return new StepResponse(undefined, []);
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    const dismissed = changes.flatMap((change) => (change.previous ? [linkOf(change.product_id, change.previous)] : []));
    const created = changes.flatMap((change) => (change.next ? [linkOf(change.product_id, change.next)] : []));
    if (dismissed.length) await link.dismiss(dismissed);
    if (created.length) await link.create(created);
    return new StepResponse(undefined, changes);
  },
  async (changes, { container }) => {
    if (!changes?.length) return;
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    const created = changes.flatMap((change) => (change.next ? [linkOf(change.product_id, change.next)] : []));
    const dismissed = changes.flatMap((change) => (change.previous ? [linkOf(change.product_id, change.previous)] : []));
    if (created.length) await link.dismiss(created);
    if (dismissed.length) await link.create(dismissed);
  },
);
