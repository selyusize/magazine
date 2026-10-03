import { brandDisplayName, brandKey } from "../brand-name";

describe("brandKey", () => {
  it("сводит написания из разных выгрузок к одному ключу", () => {
    expect(brandKey("NIKE")).toBe(brandKey("Nike."));
    expect(brandKey("«Ёлка»")).toBe("елка");
    expect(brandKey("  The   North Face ")).toBe("the north face");
    expect(brandKey("Adidas")).not.toBe(brandKey("Adidas Originals"));
  });
});

describe("brandDisplayName", () => {
  it("убирает кавычки и лишние пробелы, регистр не трогает", () => {
    expect(brandDisplayName(' "ЗАО  Обувь" ')).toBe("ЗАО Обувь");
    expect(brandDisplayName("Puma")).toBe("Puma");
  });
});
