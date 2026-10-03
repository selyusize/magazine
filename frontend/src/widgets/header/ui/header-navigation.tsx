import Image from "next/image";
import Link from "next/link";

import type { NavLink } from "@shared/config";
import { cn } from "@shared/lib/utils";
import { Container } from "@shared/ui/container";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@shared/ui/navigation-menu";

export type HeaderNavigationProps = {
  items: NavLink[];
  /** Подпись landmark-а для скринридеров */
  label?: string;
};

/** Пункт верхнего уровня — текст макета, без фона и шеврона shadcn */
const topItem =
  "block h-auto px-5.25 py-1.5 text-300 font-normal hover:bg-transparent hover:underline focus:bg-transparent data-open:bg-transparent data-open:hover:bg-transparent data-open:focus:bg-transparent [&>svg]:hidden";

/**
 * Панель без «карточки» shadcn (скругление, тень, кольцо, масштаб) — плоская, как в макете.
 * forceMount: панель всегда в серверном HTML (ссылки видны поисковикам), закрытая скрыта CSS.
 */
const panel =
  "z-50 bg-popover p-0 text-popover-foreground group-data-[viewport=false]/navigation-menu:mt-0 group-data-[viewport=false]/navigation-menu:rounded-none group-data-[viewport=false]/navigation-menu:shadow-none group-data-[viewport=false]/navigation-menu:ring-0 group-data-[viewport=false]/navigation-menu:data-open:zoom-in-100 data-closed:hidden";

/** Ссылка в панели: без фона shadcn; фокус с клавиатуры виден так же, как наведение */
const panelLink = "block rounded-none p-0 text-300 hover:bg-transparent focus:bg-transparent";

const isMega = (item: NavLink) => item.children?.some((child) => child.children?.length) ?? false;

const linksTo = (item: NavLink, href: string): boolean =>
  item.children?.some((child) => child.href === href || linksTo(child, href)) ?? false;

/**
 * Основная навигация десктопа на shadcn NavigationMenu: открытие по наведению и с клавиатуры (стрелки, Esc).
 * Пункт с группами — мега-меню на всю ширину хедера, с простыми ссылками — выпадающий список.
 */
export function HeaderNavigation({ items, label = "Основная навигация" }: HeaderNavigationProps) {
  return (
    <NavigationMenu
      viewport={false}
      aria-label={label}
      data-slot="header-navigation"
      // Мега-меню позиционируется от строки хедера (HeaderLayout): снимаем relative и у обёртки списка Radix
      className="static max-w-none flex-none justify-start *:static!"
    >
      <NavigationMenuList>
        {items.map((item) => {
          if (!item.children?.length) {
            return (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild className={topItem}>
                  <Link href={item.href}>{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }

          const mega = isMega(item);

          return (
            <NavigationMenuItem key={item.href} className={mega ? "static" : undefined}>
              {/* Пункт — ссылка на раздел: наведение раскрывает меню, клик открывает страницу раздела */}
              <NavigationMenuTrigger
                asChild
                className={cn(
                  topItem,
                  // Мост до панели через нижний отступ строки, чтобы hover не обрывался
                  mega && "relative after:absolute after:inset-x-0 after:top-full after:h-5",
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </NavigationMenuTrigger>
              {mega ? <MegaMenu item={item} /> : <Dropdown item={item} />}
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/** Простой выпадающий список. Ссылка самого пункта — первой строкой, если её нет среди вложенных */
function Dropdown({ item }: { item: NavLink }) {
  const links = linksTo(item, item.href) ? (item.children ?? []) : [{ label: item.label, href: item.href }, ...(item.children ?? [])];

  return (
    <NavigationMenuContent forceMount className={cn(panel, "min-w-48 border border-border py-2 md:w-max")}>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <NavigationMenuLink asChild className={cn(panelLink, "px-5.25 py-1.5 hover:bg-accent focus:bg-accent")}>
              <Link href={link.href}>{link.label}</Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </NavigationMenuContent>
  );
}

/** Колонки групп слева, фото справа. Колонки начинаются под навигацией (отступ под логотип, как в макете). */
function MegaMenu({ item }: { item: NavLink }) {
  return (
    <NavigationMenuContent
      forceMount
      data-slot="header-mega-menu"
      className={cn(panel, "right-0 border-b border-border md:w-auto")}
    >
      <Container className="flex justify-between gap-8 py-10">
        <ul className="flex pt-1.5 lg:ps-30">
          {item.children?.map((group) => (
            <li key={group.href} className="w-47.25">
              <NavigationMenuLink
                asChild
                className={cn(panelLink, "mb-4 text-muted-foreground hover:underline focus-visible:underline")}
              >
                <Link href={group.href}>{group.label}</Link>
              </NavigationMenuLink>
              {group.children?.length ? (
                <ul>
                  {group.children.map((link) => (
                    <li key={link.href}>
                      <NavigationMenuLink asChild className={cn(panelLink, "py-1 hover:underline focus-visible:underline")}>
                        <Link href={link.href}>{link.label}</Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
        {item.image ? (
          <NavigationMenuLink asChild className="relative hidden aspect-345/387 w-86.25 shrink-0 rounded-none p-0 lg:block">
            <Link href={item.href} tabIndex={-1}>
              <Image src={item.image.src} alt={item.image.alt} fill sizes="345px" className="object-cover" />
            </Link>
          </NavigationMenuLink>
        ) : null}
      </Container>
    </NavigationMenuContent>
  );
}
