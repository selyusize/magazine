"use client";

import { MiniCart } from "@features/mini-cart";
import { routes, siteConfig, type HeaderAction, type HeaderPanel } from "@shared/config";

import { HeaderActionsView, type HeaderPanelRender } from "../ui/header-actions";
import { useHeaderCounters } from "./use-header-counters";

const { cart } = siteConfig;

/** Шторки действий хедера. Шторка выключена в конфиге — действие остаётся ссылкой */
const panels: Partial<Record<HeaderPanel, HeaderPanelRender>> = {
  ...(cart && {
    cart: (trigger) => (
      <MiniCart {...cart} checkoutHref={routes.checkout} options={siteConfig.product.options} trigger={trigger} />
    ),
  }),
};

// Связка: счётчики пользователя (клиент) и шторки из features + «тупое» представление из ui.
export function HeaderActions({ items }: { items: HeaderAction[] }) {
  return <HeaderActionsView items={items} counters={useHeaderCounters()} panels={panels} />;
}
