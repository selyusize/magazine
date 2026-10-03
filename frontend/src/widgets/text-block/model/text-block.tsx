import { TextBlockView } from "../ui/text-block-view";
import { textBlockMock } from "./text-block.mock";
import { toParagraphs } from "./to-paragraphs";
import type { TextBlockAlign, TextBlockContent, TextBlockHeadingLevel, TextBlockTone } from "./types";

export type TextBlockProps = Partial<TextBlockContent> & {
  /** Уровень заголовка по смыслу страницы: 1 — если блок главный на странице («О нас»), иначе 2 */
  headingLevel?: TextBlockHeadingLevel;
  tone?: TextBlockTone;
  align?: TextBlockAlign;
  /** Якорь для ссылок вида /about#story */
  id?: string;
};

/**
 * Связка: текст (пока мок) + «тупое» представление из ui.
 *
 * @example Манифест бренда на главной (макет)
 * <TextBlock />
 * @example Блок «О доставке» на странице товара
 * <TextBlock title="Доставка" text={delivery} tone="plain" align="start" headingLevel={3} />
 */
export function TextBlock({
  title = textBlockMock.title,
  text = textBlockMock.text,
  action,
  headingLevel = 2,
  tone = "surface",
  align = "center",
  id,
}: TextBlockProps) {
  const paragraphs = toParagraphs(text);
  if (!title && paragraphs.length === 0) return null;

  return (
    <TextBlockView
      id={id}
      title={title}
      paragraphs={paragraphs}
      action={action}
      headingLevel={headingLevel}
      tone={tone}
      align={align}
    />
  );
}
