import type { ReactNode } from "react";

import { Container } from "@shared/ui/container";

export type FooterLayoutProps = {
  contacts?: ReactNode;
  columns?: ReactNode;
  newsletter?: ReactNode;
  socials?: ReactNode;
  bottom?: ReactNode;
};

/**
 * Раскладка футера (Figma: Footer). Регионы приходят готовыми — здесь только их места; пустой регион не занимает место.
 * - мобильные: всё в столбик;
 * - md: контакты и колонки ссылок в ряд, подписка под ними;
 * - lg: колонки до 212px слева, подписка 491px справа — сколько бы колонок ни было.
 */
export function FooterLayout({ contacts, columns, newsletter, socials, bottom }: FooterLayoutProps) {
  const hasLinks = Boolean(contacts || columns);

  return (
    <div data-slot="footer" className="border-t border-border bg-surface text-surface-foreground">
      <Container className="flex flex-col gap-20 pt-19 pb-10.5">
        {hasLinks || newsletter ? (
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-6.25">
            {hasLinks ? (
              <div className="grid gap-12 md:auto-cols-fr md:grid-flow-col md:gap-6.25 lg:flex-1 lg:auto-cols-[minmax(0,13.25rem)]">
                {contacts}
                {columns}
              </div>
            ) : null}
            {newsletter ? <div className="lg:w-122.75 lg:shrink-0 lg:px-6.25">{newsletter}</div> : null}
          </div>
        ) : null}
        {bottom || socials ? (
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            {bottom}
            {socials}
          </div>
        ) : null}
      </Container>
    </div>
  );
}
