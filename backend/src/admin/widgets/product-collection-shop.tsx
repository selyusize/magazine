import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminCollection, DetailWidgetProps } from "@medusajs/framework/types";

import { CollectionShopSection } from "../collections/components/collection-shop-section";

/** Карточка коллекции: её магазин (коллекция из дашборда создаётся без него). */
const ProductCollectionShopWidget = ({ data }: DetailWidgetProps<AdminCollection>) => (
  <CollectionShopSection collectionId={data.id} />
);

export const config = defineWidgetConfig({
  zone: "product_collection.details.before",
});

export default ProductCollectionShopWidget;
