import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type {
  AdminProduct,
  DetailWidgetProps,
} from "@medusajs/framework/types";

import { ProductAttributesSection } from "../product-attributes/components/product-attributes-section";

/** Карточка товара: значения характеристик уровня товара. */
const ProductAttributesWidget = ({ data }: DetailWidgetProps<AdminProduct>) => (
  <ProductAttributesSection productId={data.id} />
);

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductAttributesWidget;
