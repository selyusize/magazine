import { cn } from "@shared/lib/utils";

export type ProductPriceProps = {
  /** Уже отформатированная цена: «24 800 ₽», «от 4 900 ₽» */
  price: string;
  /** Цена без скидки — зачёркнута рядом */
  originalPrice?: string;
  /** Подпись старой цены для скринридеров: «Цена без скидки» */
  originalLabel?: string;
  /** Размер скидки: «−20%» */
  discount?: string;
  className?: string;
};

/** Цена товара: текущая, старая (зачёркнута) и размер скидки. */
export function ProductPrice({ price, originalPrice, originalLabel = "Цена без скидки", discount, className }: ProductPriceProps) {
  return (
    <p data-slot="product-price" className={cn("flex flex-wrap items-baseline gap-x-2.5 text-400", className)}>
      <span>{price}</span>
      {originalPrice ? (
        <s className="text-300 text-muted-foreground">
          <span className="sr-only">{originalLabel}: </span>
          {originalPrice}
        </s>
      ) : null}
      {discount ? <span className="text-300 text-destructive">{discount}</span> : null}
    </p>
  );
}
