import Link from "next/link";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@shared/ui/accordion";
import { Icon } from "@shared/ui/icon";

import type { DetailSection } from "../model/sections";

export type ProductDetailsViewProps = {
  sections: DetailSection[];
  /** id блоков, раскрытых при загрузке */
  defaultOpen?: string[];
  className?: string;
};

/**
 * Раскрывающиеся блоки о товаре (Figma: Product detail — Fit Details, Fabrication & Care, Shipping & Returns).
 * Текст закрытых блоков тоже в HTML (forceMount + hidden): поисковики видят состав, уход и условия доставки.
 * Заголовки блоков — h3 (Radix Accordion.Header): структура страницы под h1 товара.
 */
export function ProductDetailsView({ sections, defaultOpen, className }: ProductDetailsViewProps) {
  if (!sections.length) return null;

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} data-slot="product-details" className={className}>
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id} className="border-b border-border">
          <AccordionTrigger className="items-center rounded-none border-0 py-3.5 text-300 font-normal hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
            {section.title}
            <Icon name="caret-down" className="size-4 transition-transform group-aria-expanded/accordion-trigger:rotate-180" />
          </AccordionTrigger>
          <AccordionContent forceMount className="flex flex-col gap-3 pb-4 text-300 text-muted-foreground">
            {section.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {section.attributes.length ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                {section.attributes.map((attribute) => (
                  <div key={attribute.label} className="contents">
                    <dt>{attribute.label}</dt>
                    <dd className="text-foreground">{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {section.link ? (
              <Link href={section.link.href} className="text-foreground">
                {section.link.label}
              </Link>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
