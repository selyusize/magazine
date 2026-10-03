import type { ComponentProps } from "react";

import { cn } from "@shared/lib/utils";

export type ContainerSize = "narrow" | "default" | "wide" | "full";

const sizes: Record<ContainerSize, string> = {
  narrow: "max-w-narrow",
  default: "max-w-default",
  wide: "max-w-wide",
  full: "max-w-none",
};

/**
 * Ограничивает ширину контента и задаёт боковой отступ (--container-gutter из tokens.css).
 * Используется внутри страниц и виджетов:
 * <Container> для обычных блоков, <Container size="full"> для баннеров во всю ширину,
 * <Container size="narrow"> для форм и текстовых страниц.
 */
export function Container({
  size = "default",
  className,
  ...props
}: ComponentProps<"div"> & { size?: ContainerSize }) {
  return (
    <div
      data-slot="container"
      data-size={size}
      className={cn("mx-auto w-full px-(--container-gutter)", sizes[size], className)}
      {...props}
    />
  );
}
