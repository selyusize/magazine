export type TextBlockHeadingLevel = 1 | 2 | 3;

/** Фон секции: plain — фон страницы, surface — выделенная плашка, inverse — контрастная (как промо-полоса) */
export type TextBlockTone = "plain" | "surface" | "inverse";

export type TextBlockAlign = "center" | "start";

export type TextBlockAction = {
  label: string;
  href: string;
};

export type TextBlockContent = {
  title?: string;
  /** Текст: строка (абзацы разделяются пустой строкой, как приходит из CMS) или массив абзацев */
  text: string | string[];
  /** Ссылка под текстом: «О бренде», «Подробнее о доставке» */
  action?: TextBlockAction;
};
