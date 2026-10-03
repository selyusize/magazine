import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import BrandModule from "../modules/brand";

/**
 * Бренд товара: у товара один бренд, у бренда много товаров. Своя таблица связи — пишет её только команда
 * `update-catalog-for-product`. Query: `product.brand`, `brand.products`.
 */
export default defineLink(
  { linkable: ProductModule.linkable.product, isList: true },
  BrandModule.linkable.brand,
);
