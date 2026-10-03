import type { ExchangeGroup } from "./exchange-api";

export type GroupRow = ExchangeGroup & {
  depth: number;
  /** Категория, которую товары группы получат от сопоставленного предка (своей нет). */
  inherited_category: string | null;
};

/**
 * Плоский список групп → строки таблицы в порядке дерева (родитель, затем его дети) с глубиной для отступа и
 * категорией, унаследованной от предка: так в таблице видно, куда попадут товары несопоставленной подгруппы.
 * Группа с неизвестным родителем — в корне.
 */
export function toGroupRows(groups: ExchangeGroup[]): GroupRow[] {
  const ids = new Set(groups.map((group) => group.external_id));
  const children = new Map<string | null, ExchangeGroup[]>();
  for (const group of groups) {
    const parent = group.parent_external_id && ids.has(group.parent_external_id) ? group.parent_external_id : null;
    children.set(parent, [...(children.get(parent) ?? []), group]);
  }

  const rows: GroupRow[] = [];
  const visit = (parent: string | null, depth: number, inherited: string | null) => {
    for (const group of (children.get(parent) ?? []).sort((a, b) => a.name.localeCompare(b.name, "ru"))) {
      rows.push({ ...group, depth, inherited_category: group.category_id ? null : inherited });
      if (depth < 20) visit(group.external_id, depth + 1, group.category_name ?? inherited);
    }
  };
  visit(null, 0, null);
  return rows;
}
