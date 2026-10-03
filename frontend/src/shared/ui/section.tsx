import type { ComponentProps, ReactNode } from "react";

import { cn } from "@shared/lib/utils";
import { Container, type ContainerSize } from "@shared/ui/container";

export type SectionProps = Omit<ComponentProps<"section">, "title"> & {
  /** Заголовок секции — h2 (для поисковиков), размером из типошкалы, а не h2 по умолчанию */
  title?: ReactNode;
  /** Заголовок только для поисковиков и скринридеров — когда макет секции без подписи */
  titleHidden?: boolean;
  titleAlign?: "start" | "center";
  size?: ContainerSize;
};

/**
 * Блок страницы: отступы сверху/снизу, ширина контейнера и заголовок.
 * Все секции главной (коллекции, подборки товаров, Instagram) собираются на нём.
 */
export function Section({ title, titleHidden = false, titleAlign = "start", size, className, children, ...props }: SectionProps) {
  return (
    <section data-slot="section" {...props}>
      <Container size={size} className={cn("flex flex-col gap-12 py-8", className)}>
        {title ? (
          <h2 className={titleHidden ? "sr-only" : cn("p-4 text-600", titleAlign === "center" && "text-center")}>{title}</h2>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
