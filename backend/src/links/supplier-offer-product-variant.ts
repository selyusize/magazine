import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import SupplierModule from "../modules/supplier";

/** Вариант предложения без своей таблицы связи (read-only по `variant_id`): Query отдаёт `supplier_offer.product_variant`. */
export default defineLink(
  { linkable: SupplierModule.linkable.supplierOffer, field: "variant_id" },
  ProductModule.linkable.productVariant,
  { readOnly: true },
);
