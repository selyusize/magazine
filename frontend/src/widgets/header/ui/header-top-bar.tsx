import Link from "next/link";

import type { NavLink } from "@shared/config";

export type HeaderTopBarProps = {
  text: string;
  link?: NavLink;
};

/** Промо-полоса над хедером: акция, условия доставки. Цвета — токены --promo. */
export function HeaderTopBar({ text, link }: HeaderTopBarProps) {
  return (
    <div
      data-slot="header-top-bar"
      className="bg-promo px-3.75 py-3 text-center text-100 text-promo-foreground"
    >
      <p>
        {text}
        {link && " "}
        {link && (
          <Link href={link.href} className="hover:underline">
            {link.label}
          </Link>
        )}
      </p>
    </div>
  );
}
