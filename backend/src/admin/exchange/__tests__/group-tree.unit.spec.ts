import type { ExchangeGroup } from "../hooks/exchange-api";
import { toGroupRows } from "../hooks/group-tree";

const group = (external_id: string, parent: string | null, category: string | null = null): ExchangeGroup => ({
  id: `exgrp_${external_id}`,
  external_id,
  parent_external_id: parent,
  name: external_id,
  category_id: category ? `pcat_${category}` : null,
  category_name: category,
});

describe("дерево групп поставщика", () => {
  it("родитель перед детьми, глубина, категория от сопоставленного предка", () => {
    const rows = toGroupRows([
      group("Кеды", "Обувь"),
      group("Разное", null),
      group("Обувь", null, "Обувь"),
      group("Высокие", "Кеды"),
      group("Сирота", "Нет такой"),
    ]);

    expect(rows.map((row) => [row.name, row.depth, row.inherited_category])).toEqual([
      ["Обувь", 0, null],
      ["Кеды", 1, "Обувь"],
      ["Высокие", 2, "Обувь"],
      ["Разное", 0, null],
      ["Сирота", 0, null],
    ]);
  });
});
