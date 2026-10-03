import type { SocialLink } from "@shared/config";
import { Icon } from "@shared/ui/icon";

import { link } from "./classes";

export type FooterSocialsProps = {
  items: SocialLink[];
  label?: string;
};

/** Соцсети: иконки (подпись в aria-label) или текст. rel="me" — профиль принадлежит сайту. */
export function FooterSocials({ items, label = "Мы в соцсетях" }: FooterSocialsProps) {
  return (
    <ul aria-label={label} data-slot="footer-socials" className="flex flex-wrap items-center gap-4.5 text-300">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={item.icon ? item.label : undefined}
            className={item.icon ? "relative flex after:absolute after:-inset-2" : link}
          >
            {item.icon ? <Icon name={item.icon} className="size-5" /> : item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
