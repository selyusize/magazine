import Link from "next/link";
import { useId } from "react";

import { cn } from "@shared/lib/utils";
import { buttonVariants } from "@shared/ui/button";
import { Container } from "@shared/ui/container";

import type { TextBlockAction, TextBlockAlign, TextBlockHeadingLevel, TextBlockTone } from "../model/types";

const toneStyles: Record<TextBlockTone, string> = {
  plain: "bg-background text-foreground",
  surface: "bg-surface text-surface-foreground",
  inverse: "bg-promo text-promo-foreground",
};

const alignStyles: Record<TextBlockAlign, string> = {
  center: "items-center text-center",
  start: "items-start text-start",
};

const headings = { 1: "h1", 2: "h2", 3: "h3" } as const;

export type TextBlockViewProps = {
  id?: string;
  title?: string;
  paragraphs: string[];
  action?: TextBlockAction;
  headingLevel: TextBlockHeadingLevel;
  tone: TextBlockTone;
  align: TextBlockAlign;
};

/**
 * Текстовая секция: заголовок + абзацы (манифест бренда, «О нас», SEO-текст категории).
 * Весь текст в серверном HTML; секция подписана заголовком через aria-labelledby.
 */
export function TextBlockView({ id, title, paragraphs, action, headingLevel, tone, align }: TextBlockViewProps) {
  const headingId = useId();
  const Heading = headings[headingLevel];

  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      data-widget="text-block"
      data-tone={tone}
      className={toneStyles[tone]}
    >
      <Container>
        <div
          className={cn(
            "mx-auto flex max-w-narrow flex-col gap-11.75 px-4.5 pt-24 pb-45 md:px-0",
            alignStyles[align],
          )}
        >
          {title ? (
            <Heading id={headingId} className="text-900">
              {title}
            </Heading>
          ) : null}
          {paragraphs.length > 0 ? (
            <div className="flex flex-col gap-4 text-500">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : null}
          {action ? (
            <Link
              href={action.href}
              className={buttonVariants({ variant: tone === "inverse" ? "secondary" : "default", size: "xl" })}
            >
              {action.label}
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
