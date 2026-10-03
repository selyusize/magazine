import Link from "next/link";

import type { NavLink } from "@shared/config";

import { link } from "./classes";

export type FooterBottomProps = {
  /** Готовая строка: год уже подставлен */
  copyright: string;
  legal?: NavLink[];
};

/** Нижняя строка: копирайт и юридические ссылки (реквизиты, оферта). */
export function FooterBottom({ copyright, legal = [] }: FooterBottomProps) {
  return (
    <div
      data-slot="footer-bottom"
      className="flex flex-col items-center gap-x-6 gap-y-2 text-300 text-surface-muted-foreground md:flex-row md:flex-wrap"
    >
      <p>{copyright}</p>
      {legal.length > 0 ? (
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {legal.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={link}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
