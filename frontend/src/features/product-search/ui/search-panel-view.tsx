import { Slot } from "radix-ui";
import type { CSSProperties, MouseEvent, ReactElement, ReactNode } from "react";

import { Container } from "@shared/ui/container";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@shared/ui/dialog";

export type SearchPanelViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Элемент, открывающий панель. Должен принимать onClick и ref: Button, Link, <a>, <button> */
  trigger: ReactElement;
  onTriggerClick: (event: MouseEvent) => void;
  onContentClick?: (event: MouseEvent) => void;
  /** Отступ панели и подложки от верха окна — нижний край хедера, px */
  top: number;
  /** Заголовок диалога для скринридеров */
  title: string;
  /** Содержимое панели — обычно SearchPanelSections. Монтируется только при открытии */
  children: ReactNode;
};

/**
 * Панель поиска (Figma: Search) на shadcn Dialog: выезжает под хедером на всю ширину, ниже — затемнение.
 * Хедер остаётся видимым. Фокус в панели, Esc и клик по затемнению закрывают её, фокус возвращается на иконку.
 * Закрытая панель не рендерится: в HTML страницы — только ссылка-иконка на страницу поиска.
 */
export function SearchPanelView({
  open,
  onOpenChange,
  trigger,
  onTriggerClick,
  onContentClick,
  top,
  title,
  children,
}: SearchPanelViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Обработчик Slot срабатывает раньше Radix: отменённый клик не переключает диалог повторно */}
      <DialogTrigger asChild>
        <Slot.Root onClick={onTriggerClick}>{trigger}</Slot.Root>
      </DialogTrigger>
      <DialogContent
        data-slot="search-panel"
        showCloseButton={false}
        aria-describedby={undefined}
        onClick={onContentClick}
        overlayProps={{ style: { top }, className: "bg-black/50" }}
        style={{ "--search-panel-top": `${top}px` } as CSSProperties}
        className="top-(--search-panel-top) left-0 block max-h-[calc(100dvh-var(--search-panel-top))] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto overscroll-contain rounded-none bg-background p-0 text-foreground ring-0 sm:max-w-none data-open:slide-in-from-top-2 data-open:zoom-in-100 data-closed:zoom-out-100"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <Container>{children}</Container>
      </DialogContent>
    </Dialog>
  );
}

export type SearchPanelSectionsProps = {
  /** Поле поиска (SearchField) */
  field: ReactNode;
  /** Под полем: результаты, «ничего не найдено», популярные запросы. Пусто — панель только с полем */
  children?: ReactNode;
  /** Идёт запрос — для скринридеров */
  busy?: boolean;
};

/** Раскладка панели: поле, под ним результаты. Изменения результатов озвучиваются скринридером */
export function SearchPanelSections({ field, children, busy }: SearchPanelSectionsProps) {
  return (
    <div className="md:px-4.5">
      <div className="py-6.75">{field}</div>
      <div aria-live="polite" aria-busy={busy} className="empty:hidden pt-6 pb-8 md:pt-13">
        {children}
      </div>
    </div>
  );
}
