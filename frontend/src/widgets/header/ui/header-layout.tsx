import type { ReactNode } from "react";

import { cn } from "@shared/lib/utils";
import { Container } from "@shared/ui/container";

export type HeaderVariant = "inline" | "centered";

/** Мобильные — всегда «меню | логотип | действия», варианты различаются с md */
const variants: Record<HeaderVariant, { row: string; logo: string }> = {
  inline: {
    row: "md:grid-cols-[auto_1fr_auto] md:[grid-template-areas:'logo_nav_actions']",
    logo: "md:justify-self-start",
  },
  centered: {
    row: "md:grid-cols-[1fr_auto_1fr] md:[grid-template-areas:'nav_logo_actions']",
    logo: "md:justify-self-center",
  },
};

export type HeaderLayoutProps = {
  variant: HeaderVariant;
  topBar?: ReactNode;
  menu?: ReactNode;
  logo?: ReactNode;
  navigation?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
};

/**
 * Раскладка хедера: промо-полоса и строка на CSS grid с именованными областями.
 * Регионы приходят готовыми — здесь только их места. Пустой регион не занимает место.
 */
export function HeaderLayout({ variant, topBar, menu, logo, navigation, search, actions }: HeaderLayoutProps) {
  const styles = variants[variant];

  return (
    <div data-slot="header" data-variant={variant}>
      {topBar}
      {/* relative — от этой строки на всю её ширину раскрывается мега-меню навигации */}
      <div className="relative border-b border-border bg-background">
        <Container
          className={cn(
            "grid min-h-12.5 grid-cols-[1fr_auto_1fr] items-center gap-x-4 py-3.75 [grid-template-areas:'menu_logo_actions'] md:py-4.5",
            styles.row,
          )}
        >
          {menu ? <div className="flex [grid-area:menu] md:hidden">{menu}</div> : null}
          {logo ? <div className={cn("justify-self-center [grid-area:logo]", styles.logo)}>{logo}</div> : null}
          {navigation ? <div className="hidden [grid-area:nav] md:block">{navigation}</div> : null}
          {search || actions ? (
            <div className="flex items-center justify-end gap-3.25 [grid-area:actions] md:gap-4.5">
              {search}
              {actions}
            </div>
          ) : null}
        </Container>
      </div>
    </div>
  );
}
