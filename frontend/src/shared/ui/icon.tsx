import type { ComponentProps, CSSProperties } from "react";

import { icons, type IconName } from "@shared/config";
import { cn } from "@shared/lib/utils";

/**
 * Иконка по имени из реестра (shared/config/icons). SVG рисуется маской, цвет — currentColor:
 * красится через text-*, работает в тёмной теме и на hover. Размер — классом size-*.
 * Декоративная: подпись даёт родитель (aria-label ссылки/кнопки или текст рядом).
 */
export function Icon({ name, className, style, ...props }: ComponentProps<"span"> & { name: IconName }) {
  return (
    <span
      aria-hidden
      data-slot="icon"
      data-icon={name}
      className={cn("inline-block size-3.5 shrink-0 bg-current mask-(--icon) mask-contain mask-center mask-no-repeat", className)}
      style={{ "--icon": `url(${icons[name]})`, ...style } as CSSProperties}
      {...props}
    />
  );
}
