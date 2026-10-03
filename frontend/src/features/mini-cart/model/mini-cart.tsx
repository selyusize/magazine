"use client";

import { MiniCartView, type MiniCartContent, type MiniCartViewProps } from "../ui/mini-cart-view";
import { useMiniCart, type UseMiniCartOptions } from "./use-mini-cart";

export type MiniCartProps = MiniCartContent & UseMiniCartOptions & Pick<MiniCartViewProps, "trigger">;

/**
 * Связка: корзина и мутации из model + «тупая» шторка из ui. Тексты — из siteConfig.cart.
 *
 * @example В хедере (так подключает HeaderActions для действия с panel: "cart")
 * <MiniCart {...siteConfig.cart} checkoutHref={routes.checkout} options={siteConfig.product.options} trigger={icon} />
 */
export function MiniCart({ options, ...content }: MiniCartProps) {
  return <MiniCartView {...content} {...useMiniCart({ options })} />;
}
