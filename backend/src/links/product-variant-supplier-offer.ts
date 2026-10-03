import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import SupplierModule from "../modules/supplier";

/**
 * Обратная сторона `supplier-offer-product-variant.ts`: `product_variant.supplier_offers` — все предложения варианта
 * (один товар у нескольких поставщиков — одна карточка). Read-only по `supplier_offer.variant_id`.
 */
export default defineLink(
  { linkable: ProductModule.linkable.productVariant, field: "id" },
  {
    ...SupplierModule.linkable.supplierOffer.id,
    primaryKey: "variant_id",
  },
  // isList read-only связи берётся из опций, не из описания второй стороны
  { readOnly: true, isList: true },
);
