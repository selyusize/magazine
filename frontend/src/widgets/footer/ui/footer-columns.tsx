import type { FooterColumn as FooterColumnData } from "@shared/config";

import { FooterColumn } from "./footer-column";

export type FooterColumnsProps = {
  columns: FooterColumnData[];
};

/** Колонки ссылок. Без обёртки: каждая колонка — ячейка сетки футера рядом с контактами. */
export function FooterColumns({ columns }: FooterColumnsProps) {
  return columns.map((column) => <FooterColumn key={column.title} {...column} />);
}
