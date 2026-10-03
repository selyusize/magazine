import type { ProductDetail } from "@entities/product";
import { siteConfig, type ProductPageConfig } from "@shared/config";

import { ProductDetailsView } from "../ui/product-details-view";
import { toDetailSections } from "./sections";

export type ProductDetailsProps = {
  product: ProductDetail;
  /** Блоки и единицы измерения. По умолчанию — siteConfig.product */
  config?: Pick<ProductPageConfig, "sections" | "units">;
  defaultOpen?: string[];
  className?: string;
};

/** Блоки о товаре из конфига + данные товара. Серверный компонент: весь текст — в HTML страницы. */
export function ProductDetails({ product, config = siteConfig.product, defaultOpen, className }: ProductDetailsProps) {
  const sections = toDetailSections(product, config.sections, { units: config.units, locale: siteConfig.locale });
  return <ProductDetailsView sections={sections} defaultOpen={defaultOpen} className={className} />;
}
