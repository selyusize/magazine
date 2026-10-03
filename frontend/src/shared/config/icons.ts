/**
 * Иконки интерфейса — файлы в public/icons (из макета, набор Phosphor).
 * Другой магазин — другие файлы или пути здесь; компоненты обращаются к иконке по имени.
 */
export const icons = {
  search: "/icons/search.svg",
  user: "/icons/user.svg",
  heart: "/icons/heart.svg",
  "heart-fill": "/icons/heart-fill.svg",
  bag: "/icons/bag.svg",
  menu: "/icons/menu.svg",
  "caret-down": "/icons/caret-down.svg",
  "caret-left": "/icons/caret-left.svg",
  close: "/icons/close.svg",
  plus: "/icons/plus.svg",
  minus: "/icons/minus.svg",
  pause: "/icons/pause.svg",
  play: "/icons/play.svg",
  instagram: "/icons/instagram.svg",
  star: "/icons/star.svg",
} as const;

export type IconName = keyof typeof icons;
