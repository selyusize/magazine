import { parseRedirectsCSV } from "../redirects-csv";

describe("parseRedirectsCSV", () => {
  it("читает CSV из Excel: `;`, BOM, заголовок, коды по умолчанию", () => {
    const csv =
      "﻿откуда;куда;код\r\n/old;/new;\r\n/gone;;\r\n\r\n/tmp;/promo;302\r\n";
    expect(parseRedirectsCSV(csv)).toEqual([
      { from_path: "/old", to_path: "/new", code: 301 },
      { from_path: "/gone", to_path: null, code: 410 },
      { from_path: "/tmp", to_path: "/promo", code: 302 },
    ]);
  });

  it("читает `,` и кавычки, нормализует пути", () => {
    expect(parseRedirectsCSV('"https://olisa.ru/a/","/b?x=1",301')).toEqual([
      { from_path: "/a", to_path: "/b", code: 301 },
    ]);
  });

  it("сообщает номер строки с ошибкой", () => {
    expect(() => parseRedirectsCSV("/a;/b\n/c;/d;410")).toThrow(
      "CSV, строка 2",
    );
    expect(() => parseRedirectsCSV("\n\n")).toThrow("пустой");
  });
});
