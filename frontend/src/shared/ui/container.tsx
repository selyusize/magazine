import type { ComponentProps } from "react";

export type ContainerSize = "narrow" | "default" | "wide" | "full";

/**
 * Ограничивает ширину контента. Используется внутри страниц и виджетов:
 * <Container> для обычных блоков, <Container size="full"> для баннеров во всю ширину,
 * <Container size="narrow"> для форм и текстовых страниц.
 */
export function Container({ size = "default", ...props }: ComponentProps<"div"> & { size?: ContainerSize }) {
  return <div data-slot="container" data-size={size} {...props} />;
}
