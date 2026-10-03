import { MedusaError } from "@medusajs/framework/utils";

import { findRedirectProblem, normalizePath, type RedirectCode } from "./path";

export type RedirectCSVRow = {
  from_path: string;
  to_path: string | null;
  code: RedirectCode;
};

const HEADER_CELLS = new Set(["from", "from_path", "откуда"]);

/**
 * CSV из админки: `откуда;куда;код`. Разделитель — `;` (Excel в русской локали) или `,`, первая строка-заголовок
 * необязательна. Пустое «куда» — 410, пустой код — 301. Ошибка — с номером строки, чтобы её можно было найти в файле.
 */
export function parseRedirectsCSV(text: string): RedirectCSVRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const delimiter = lines.find((line) => line.trim())?.includes(";")
    ? ";"
    : ",";
  const rows: RedirectCSVRow[] = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    const cells = line.split(delimiter).map((cell) =>
      cell
        .trim()
        .replace(/^"(.*)"$/, "$1")
        .trim(),
    );
    if (rows.length === 0 && HEADER_CELLS.has(cells[0].toLowerCase())) return;

    const lineNumber = index + 1;
    const [from, to = "", rawCode = ""] = cells;
    if (!from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `CSV, строка ${lineNumber}: не указан исходный путь`,
      );
    }

    const to_path = to ? normalizePath(to) : null;
    const code = rawCode ? Number(rawCode) : to_path === null ? 410 : 301;
    const row = {
      from_path: normalizePath(from),
      to_path,
      code: code as RedirectCode,
    };

    const problem = findRedirectProblem(row);
    if (problem)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `CSV, строка ${lineNumber}: ${problem}`,
      );
    rows.push(row);
  });

  if (rows.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "CSV пустой — нет ни одного редиректа",
    );
  }
  return rows;
}
