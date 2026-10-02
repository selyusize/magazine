import { resolveSlot, type Slot } from "@shared/lib/slot";

import { FooterBottom } from "./footer-bottom";
import { FooterColumns } from "./footer-columns";
import { FooterContacts } from "./footer-contacts";
import { FooterSocials } from "./footer-socials";

/**
 * Регионы как у Header: не передан — стандартный компонент, `null` — скрыт, свой элемент — вместо стандартного.
 *
 * @example Только нижняя строка
 * <Footer columns={null} contacts={null} socials={null} />
 */
export type FooterProps = {
  columns?: Slot;
  contacts?: Slot;
  socials?: Slot;
  bottom?: Slot;
};

export function Footer({ columns, contacts, socials, bottom }: FooterProps) {
  return (
    <div>
      <div>
        {resolveSlot(columns, () => <FooterColumns />)}
        {resolveSlot(contacts, () => <FooterContacts />)}
        {resolveSlot(socials, () => <FooterSocials />)}
      </div>
      {resolveSlot(bottom, () => <FooterBottom />)}
    </div>
  );
}
