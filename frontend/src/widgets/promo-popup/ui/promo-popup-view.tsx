import Image from "next/image";
import type { ReactNode } from "react";

import type { PromoPopupConfig } from "@shared/config";
import { cn } from "@shared/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@shared/ui/dialog";

export type PromoPopupViewProps = Pick<
  PromoPopupConfig,
  "eyebrow" | "title" | "description" | "image" | "imagePosition"
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Действие под текстом: форма подписки, кнопка-ссылка, промокод */
  children?: ReactNode;
};

/**
 * Промо-попап (Figma: Promotion) на shadcn Dialog: фото и текст в две колонки, на мобильных — только текст.
 * Только разметка: когда открыть и что запомнить — в model/use-promo-popup.
 * Закрытый попап не рендерится вовсе (в т. ч. на сервере), поэтому его заголовок не попадает
 * в структуру заголовков страницы, а фото грузится только при показе.
 */
export function PromoPopupView({
  eyebrow,
  title,
  description,
  image,
  imagePosition = "start",
  open,
  onOpenChange,
  children,
}: PromoPopupViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="promo-popup"
        // Без описания Radix ждёт явный отказ от aria-describedby
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "max-w-[calc(100%-1.375rem)] gap-0 overflow-hidden rounded-none bg-surface p-0 text-surface-foreground ring-0 sm:max-w-97",
          // Крестик shadcn: положение и размер по макету
          "*:data-[slot=dialog-close]:top-3 *:data-[slot=dialog-close]:right-3 *:data-[slot=dialog-close]:size-8 [&>[data-slot=dialog-close]_svg]:size-5",
          image && "md:max-w-193 md:grid-cols-2",
        )}
      >
        {image ? (
          <div data-slot="promo-popup-media" className={cn("relative hidden md:block", imagePosition === "end" && "md:order-last")}>
            <Image src={image.src} alt={image.alt} fill sizes="24rem" className="object-cover" />
          </div>
        ) : null}
        <div data-slot="promo-popup-body" className="flex min-h-116 flex-col items-center justify-center px-13.5 py-14">
          <DialogHeader className="items-center gap-3 text-center">
            {eyebrow ? <p className="mb-2 text-300">{eyebrow}</p> : null}
            <DialogTitle className="text-900 text-balance" style={{ fontWeight: "var(--heading-weight)" }}>
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="text-300 text-surface-foreground">{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          {children ? <div className="mt-7.5 flex w-full flex-col items-center gap-4.5">{children}</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
