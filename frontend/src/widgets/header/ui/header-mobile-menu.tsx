import Link from "next/link";
import type { ReactNode } from "react";

import type { NavLink } from "@shared/config";
import { cn } from "@shared/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@shared/ui/accordion";
import { Button } from "@shared/ui/button";
import { Icon } from "@shared/ui/icon";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@shared/ui/sheet";

import { hitArea } from "./classes";

export type HeaderMobileMenuProps = {
  navigation: NavLink[];
  /** Вторичные ссылки внизу меню: магазины, личный кабинет… */
  links?: NavLink[];
  title?: string;
};

/**
 * Мобильное меню в shadcn Sheet на весь экран, вложенные пункты — shadcn Accordion.
 * Панель рендерится только при открытии — для поисковиков те же ссылки уже есть в HTML десктопной навигации.
 */
const divider = "not-last:border-b not-last:border-border";

export function HeaderMobileMenu({ navigation, links = [], title = "Меню" }: HeaderMobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="bare" size="bare" aria-label="Открыть меню" data-slot="header-menu-trigger" className={hitArea}>
          <Icon name="menu" className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-full gap-0 overflow-y-auto shadow-none sm:max-w-sm"
      >
        <SheetHeader className="flex-row items-center border-b border-border px-6 py-5.25">
          <SheetClose asChild>
            <Button variant="bare" size="bare" aria-label="Закрыть меню" className={hitArea}>
              <Icon name="close" className="size-6" />
            </Button>
          </SheetClose>
          <SheetTitle className="sr-only">{title}</SheetTitle>
        </SheetHeader>
        <nav aria-label="Мобильная навигация" className="px-7.5 pt-5">
          <Accordion type="multiple" asChild>
            <ul>
              {navigation.map((item) =>
                item.children?.length ? (
                  <AccordionItem key={item.href} value={item.href} asChild className={divider}>
                    <li>
                      <Disclosure label={item.label} className="py-3.75">
                        <ul className="pb-3.75">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <SubMenu item={child} />
                            </li>
                          ))}
                        </ul>
                      </Disclosure>
                    </li>
                  </AccordionItem>
                ) : (
                  <li key={item.href} className={divider}>
                    <MenuLink href={item.href} className="py-3.75">
                      {item.label}
                    </MenuLink>
                  </li>
                ),
              )}
            </ul>
          </Accordion>
        </nav>
        {links.length ? (
          <ul className="mt-5 px-7.5 pb-5">
            {links.map((link) => (
              <li key={link.href}>
                <MenuLink href={link.href} className="py-3 text-200 text-muted-foreground">
                  {link.label}
                </MenuLink>
              </li>
            ))}
          </ul>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** Второй уровень: группа раскрывается в список с линией слева, простой пункт — ссылка */
function SubMenu({ item }: { item: NavLink }) {
  if (!item.children?.length) {
    return (
      <MenuLink href={item.href} className="py-4 ps-3.75 text-muted-foreground">
        {item.label}
      </MenuLink>
    );
  }

  return (
    <Accordion type="multiple">
      <AccordionItem value={item.href} className="border-0">
        <Disclosure label={item.label} className="py-4 ps-3.75 text-muted-foreground">
          <ul className="relative ms-3.5 ps-4 before:absolute before:inset-y-3.5 before:left-0 before:w-px before:bg-border">
            {item.children.map((link) => (
              <li key={link.href}>
                <MenuLink href={link.href} className="py-3.75 text-muted-foreground">
                  {link.label}
                </MenuLink>
              </li>
            ))}
          </ul>
        </Disclosure>
      </AccordionItem>
    </Accordion>
  );
}

/**
 * Строка-переключатель shadcn Accordion с плюсом / минусом макета вместо шевронов shadcn.
 * Должна лежать внутри AccordionItem. className — отступы и цвет строки (иконка берёт цвет текста)
 */
function Disclosure({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <>
      <AccordionTrigger
        className={cn(
          "items-center rounded-none border-0 text-300 font-normal hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden",
          className,
        )}
      >
        {label}
        <Icon name="plus" className="size-4.5 group-aria-expanded/accordion-trigger:hidden" />
        <Icon name="minus" className="hidden size-4.5 group-aria-expanded/accordion-trigger:inline-block" />
      </AccordionTrigger>
      <AccordionContent className="p-0 [&_a]:no-underline">{children}</AccordionContent>
    </>
  );
}

function MenuLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <SheetClose asChild>
      <Link href={href} className={cn("block text-300 hover:underline", className)}>
        {children}
      </Link>
    </SheetClose>
  );
}
