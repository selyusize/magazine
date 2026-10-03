"use client";

import { ProductGalleryView, type ProductGalleryViewProps } from "../ui/product-gallery-view";
import { useProductGallery } from "./use-product-gallery";

export type ProductGalleryProps = Pick<ProductGalleryViewProps, "images" | "layout" | "aspectRatio" | "label" | "sizes" | "className">;

// Связка: состояние галереи из model + «тупое» представление из ui.
export function ProductGallery(props: ProductGalleryProps) {
  return <ProductGalleryView {...props} {...useProductGallery({ layout: props.layout })} />;
}
