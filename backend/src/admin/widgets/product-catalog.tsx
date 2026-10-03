import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type {
  AdminProduct,
  DetailWidgetProps,
} from "@medusajs/framework/types";

import { ProductCatalogSection } from "../product-catalog/components/product-catalog-section";

/** Карточка товара, боковая колонка: бренд и основная категория. */
const ProductCatalogWidget = ({ data }: DetailWidgetProps<AdminProduct>) => (
  <ProductCatalogSection productId={data.id} />
);

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
});

export default ProductCatalogWidget;
