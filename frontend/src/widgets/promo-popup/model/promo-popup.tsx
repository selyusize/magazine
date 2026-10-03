"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { NewsletterForm } from "@features/newsletter";
import type { PromoPopupConfig } from "@shared/config";
import { Button } from "@shared/ui/button";

import { PromoPopupView } from "../ui/promo-popup-view";
import { usePromoPopup } from "./use-promo-popup";

export type PromoPopupProps = PromoPopupConfig & {
  /** Своё действие вместо формы и cta из конфига: промокод, выбор пола, ссылка на квиз */
  action?: ReactNode;
};

/**
 * Связка: триггеры и память из model + «тупое» представление из ui.
 * Данные обычно из siteConfig.promoPopup; несколько кампаний — несколько <PromoPopup> с разными id.
 *
 * @example Попап распродажи без формы
 * <PromoPopup id="sale-autumn" title="−40% на верхнюю одежду" form={null}
 *   cta={{ label: "К распродаже", href: "/sale" }} trigger={{ delay: 5000 }} dismissDays={3} />
 */
export function PromoPopup({ id, trigger, dismissDays, excludePaths, form, cta, action, ...content }: PromoPopupProps) {
  const { onSubscribed, ...state } = usePromoPopup({ id, trigger, dismissDays, excludePaths });

  return (
    <PromoPopupView {...content} {...state}>
      {action ?? (
        <>
          {form ? <NewsletterForm {...form} align="center" onSubscribed={onSubscribed} /> : null}
          {cta ? (
            <Button asChild variant={form ? "link" : "default"} size="xl">
              <Link href={cta.href} onClick={() => state.onOpenChange(false)}>
                {cta.label}
              </Link>
            </Button>
          ) : null}
        </>
      )}
    </PromoPopupView>
  );
}
