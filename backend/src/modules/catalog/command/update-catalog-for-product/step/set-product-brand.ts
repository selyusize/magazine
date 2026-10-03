import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { BRAND_MODULE } from "../../../../brand";
import type { ProductCatalogChange } from "./validate-product-catalog";

type BrandLinks = {
  product_id: string;
  previous: string | null;
  next: string | null;
};

const linkOf = (product_id: string, brand_id: string) => ({
  [Modules.PRODUCT]: { product_id },
  [BRAND_MODULE]: { brand_id },
});

/** Переставляет связь `product ↔ brand` (src/links/product-brand.ts); откат возвращает прежний бренд. */
export const setProductBrandStep = createStep(
  "set-product-brand",
  async (change: ProductCatalogChange, { container }) => {
    if (!change.brand) return new StepResponse(undefined, null);

    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const links: BrandLinks = {
      product_id: change.product_id,
      ...change.brand,
    };
    if (links.previous)
      await link.dismiss(linkOf(links.product_id, links.previous));
    if (links.next) await link.create(linkOf(links.product_id, links.next));
    return new StepResponse(undefined, links);
  },
  async (links, { container }) => {
    if (!links) return;
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    if (links.next) await link.dismiss(linkOf(links.product_id, links.next));
    if (links.previous)
      await link.create(linkOf(links.product_id, links.previous));
  },
);
