import Link from "next/link";
import { useId } from "react";

import type { NavLink } from "@shared/config";

import { columnList, columnTitle, link } from "./classes";

export type FooterColumnProps = {
  title: string;
  links: NavLink[];
};

/**
 * Колонка ссылок: отдельный <nav>, подписанный своим заголовком, — скринридер покажет
 * «Покупателям, навигация». Подпись — не h-тег: футер на каждой странице и не должен ломать её структуру заголовков.
 */
export function FooterColumn({ title, links }: FooterColumnProps) {
  const titleId = useId();

  return (
    <nav aria-labelledby={titleId} data-slot="footer-column" className="flex min-w-0 flex-col gap-5">
      <p id={titleId} className={columnTitle}>
        {title}
      </p>
      <ul className={columnList}>
        {links.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link href={item.href} className={link}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
