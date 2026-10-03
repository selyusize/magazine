/**
 * Элемент XML, собранный потоковым ридером: имя без префикса пространства имён, атрибуты, текст и дети.
 * Только данные — разбор конкретного формата (CommerceML) делают чистые функции над этим деревом.
 */
export type XMLNode = {
  name: string;
  attributes: Record<string, string>;
  /** Текст элемента без вложенных элементов, обрезанный по краям. */
  text: string;
  children: XMLNode[];
};

/** Первый ребёнок с таким именем. */
export function childOf(node: XMLNode | undefined, name: string): XMLNode | undefined {
  return node?.children.find((child) => child.name === name);
}

/** Все дети с таким именем. */
export function childrenOf(node: XMLNode | undefined, name: string): XMLNode[] {
  return node?.children.filter((child) => child.name === name) ?? [];
}

/**
 * Текст по пути из имён детей (`textOf(товар, "Изготовитель", "Наименование")`). Нет элемента или текст пустой —
 * `null`: в выгрузках пустой тег и отсутствующий значат одно и то же.
 */
export function textOf(node: XMLNode | undefined, ...path: string[]): string | null {
  let current = node;
  for (const name of path) current = childOf(current, name);
  const text = current?.text ?? "";
  return text ? text : null;
}
