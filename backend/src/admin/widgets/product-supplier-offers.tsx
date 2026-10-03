import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type {
  AdminProduct,
  DetailWidgetProps,
} from "@medusajs/framework/types";

import { SupplierOffersSection } from "../supplier-offers/components/supplier-offers-section";

/** Карточка товара: предложения поставщиков по вариантам. */
const ProductSupplierOffersWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => (
  <SupplierOffersSection
    productId={data.id}
    variants={(data.variants ?? []).map((variant) => ({
      id: variant.id,
      title: variant.title ?? variant.id,
    }))}
  />
);

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductSupplierOffersWidget;
