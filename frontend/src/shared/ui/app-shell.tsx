import type { ReactNode } from "react";

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
    <div data-slot="app-shell" data-layout={layout}>
      <a href="#main" data-slot="skip-link">
        Перейти к содержимому
      </a>
      {header ? (
        <header data-slot="app-header" data-sticky={stickyHeader || undefined}>
          {header}
        </header>
      ) : null}
      <main id="main" data-slot="app-main">
        {children}
      </main>
      {footer ? <footer data-slot="app-footer">{footer}</footer> : null}
    </div>
  );
}
