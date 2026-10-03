"use client";

import type { ReactNode } from "react";

import { AddToCart } from "@features/add-to-cart";
import { VariantPickerView } from "@features/variant-picker";
import { ProductGallery, ProductPrice, type ProductDetail } from "@entities/product";
import { siteConfig, type ProductPageConfig } from "@shared/config";

import { ProductOverviewView } from "../ui/product-overview-view";
import { useProductOverview } from "./use-product-overview";

export type ProductOverviewProps = {
  product: ProductDetail;
  /** Вариант из ссылки (`?variant=`): выбран при открытии */
  initialVariantId?: string;
  /** Галерея, опции, тексты кнопки. По умолчанию — siteConfig.product */
  config?: ProductPageConfig;
  /** Серверные регионы: кнопки у названия, блоки о товаре */
  actions?: ReactNode;
  details?: ReactNode;
  className?: string;
};

/**
 * Первый экран товара: галерея, название, цена, выбор опций и покупка. Рендерится на сервере (весь текст в HTML),
 * в браузере оживает выбор варианта: цена, фото цвета, кнопка и `?variant=` в адресе меняются без перезагрузки.
 */
export function ProductOverview({
  product,
  initialVariantId,
  config = siteConfig.product,
  actions,
  details,
  className,
}: ProductOverviewProps) {
  const { groups, onSelect, images, price, summary, buy } = useProductOverview(product, config, initialVariantId);
  const { gallery, cart } = config;

  return (
    <ProductOverviewView
      className={className}
      sticky={gallery.layout === "stack"}
      gallery={
        <ProductGallery
          // Сменился набор фото (другой цвет) — галерея с первого фото
          key={images[0]?.src}
          images={images}
          layout={gallery.layout}
          aspectRatio={gallery.aspectRatio}
          label={gallery.label}
        />
      }
      title={product.title}
      actions={actions}
      price={price ? <ProductPrice {...price} originalLabel={config.oldPriceLabel} /> : null}
      summary={summary}
      picker={<VariantPickerView groups={groups} onSelect={onSelect} soldOutLabel={cart.soldOutLabel.toLocaleLowerCase()} />}
      buy={<AddToCart variantId={buy.variantId} label={buy.label} addedMessage={cart.addedMessage} cartLabel={cart.cartLabel} />}
      details={details}
    />
  );
}
