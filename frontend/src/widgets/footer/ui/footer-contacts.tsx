import { toPhoneHref } from "@shared/lib/structured-data";

import { columnList, columnTitle, link } from "./classes";

export type FooterContactsProps = {
  title: string;
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
};

/**
 * Колонка контактов в <address> — контакты владельца сайта.
 * Телефон и email — ссылки tel: / mailto:, на мобильных открывают звонилку и почту.
 */
export function FooterContacts({ title, phone, email, address, workingHours }: FooterContactsProps) {
  if (!phone && !email && !address && !workingHours) return null;

  return (
    <div data-slot="footer-contacts" className="flex min-w-0 flex-col gap-5">
      <p className={columnTitle}>{title}</p>
      <address className={`${columnList} not-italic`}>
        {phone ? (
          <a href={`tel:${toPhoneHref(phone)}`} className={link}>
            {phone}
          </a>
        ) : null}
        {email ? (
          <a href={`mailto:${email}`} className={`${link} break-all`}>
            {email}
          </a>
        ) : null}
        {address ? <span>{address}</span> : null}
        {workingHours ? <span>{workingHours}</span> : null}
      </address>
    </div>
  );
}
