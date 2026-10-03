import type { ReactNode } from "react";

import { StickyHeaderOffset } from "./sticky-header-offset";

export type AppShellProps = {
  /** Содержимое хедера. Не передан / null — хедера нет (например, лендинг) */
  header?: ReactNode;
  /** Содержимое футера. Не передан / null — футера нет (например, оформление заказа) */
  footer?: ReactNode;
  /** Хедер прилипает к верху при прокрутке */
  stickyHeader?: boolean;
  /** Имя варианта лайаута — для стилей и аналитики: data-layout="shop" | "checkout" | … */
  layout?: string;
  children: ReactNode;
};

/**
 * Каркас страницы: header / main / footer. Только структура и landmark-теги,
 * без знаний о содержимом — его передают варианты лайаута из app/layouts.
 * Ширину контента задаёт страница через <Container>, main — во всю ширину.
 */
export function AppShell({ header, footer, stickyHeader, layout, children }: AppShellProps) {
  return (
    <div data-slot="app-shell" data-layout={layout} className="flex min-h-full flex-1 flex-col">
      <a
        href="#main"
        data-slot="skip-link"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:bg-background focus:px-4 focus:py-2"
      >
        Перейти к содержимому
      </a>
      {header ? (
        <header data-slot="app-header" data-sticky={stickyHeader || undefined} className="data-sticky:sticky data-sticky:top-0 data-sticky:z-40">
          {header}
          {stickyHeader ? <StickyHeaderOffset /> : null}
        </header>
      ) : null}
      <main id="main" data-slot="app-main" className="flex-1">
        {children}
      </main>
      {footer ? <footer data-slot="app-footer">{footer}</footer> : null}
    </div>
  );
}
