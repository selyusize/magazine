import type { ReactNode } from "react";

import { NewsletterForm } from "@features/newsletter";
import { siteConfig } from "@shared/config";

import { FooterBottom } from "../ui/footer-bottom";
import { FooterColumns } from "../ui/footer-columns";
import { FooterContacts } from "../ui/footer-contacts";
import { FooterLayout } from "../ui/footer-layout";
import { FooterSocials } from "../ui/footer-socials";

const { footer } = siteConfig;

/** «© {year} Magazine» → «© 2026 Magazine» */
export function formatCopyright(template: string, date = new Date()) {
  return template.replaceAll("{year}", String(date.getFullYear()));
}

/**
 * Регионы как у Header: не передан — стандартный компонент с данными из siteConfig, `null` — скрыт,
 * свой элемент — вместо стандартного. Пустые данные в конфиге (нет колонок, соцсетей) тоже скрывают регион.
 *
 * @example Только нижняя строка
 * <Footer contacts={null} columns={null} newsletter={null} />
 *
 * @example Свои колонки и форма подписки с другими текстами
 * <Footer columns={<FooterColumns columns={landingColumns} />} newsletter={<NewsletterForm {...promoTexts} />} />
 */
export type FooterProps = {
  contacts?: ReactNode;
  columns?: ReactNode;
  newsletter?: ReactNode;
  socials?: ReactNode;
  bottom?: ReactNode;
};

// Значения по умолчанию срабатывают только для undefined — переданный null скрывает регион
export function Footer({
  contacts = footer.contacts && <FooterContacts title={footer.contacts.title} {...siteConfig.contacts} />,
  columns = footer.columns.length > 0 && <FooterColumns columns={footer.columns} />,
  newsletter = footer.newsletter && <NewsletterForm {...footer.newsletter} />,
  socials = siteConfig.socials.length > 0 && <FooterSocials items={siteConfig.socials} />,
  bottom = <FooterBottom copyright={formatCopyright(footer.copyright)} legal={footer.legal} />,
}: FooterProps) {
  return (
    <FooterLayout contacts={contacts} columns={columns} newsletter={newsletter} socials={socials} bottom={bottom} />
  );
}
