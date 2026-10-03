import { normalizeAttributeValue } from "../attribute-value";

const string = { name: "Материал", type: "string" as const };
const number = { name: "Мощность", type: "number" as const };
const boolean = { name: "Водонепроницаемость", type: "boolean" as const };

describe("normalizeAttributeValue", () => {
  it("строка: сжимает пробелы, slug для фильтра", () => {
    expect(normalizeAttributeValue(string, "  Хлопок   100% ")).toEqual({
      value: "Хлопок 100%",
      handle: "hlopok-100",
      number: null,
    });
  });

  it("пустое значение — значения нет", () => {
    expect(normalizeAttributeValue(string, "   ")).toBeNull();
  });

  it("число: запятая, пробелы в разрядах; не число — 400", () => {
    expect(normalizeAttributeValue(number, "1 500,5")).toEqual({
      value: "1500.5",
      handle: "1500-5",
      number: 1500.5,
    });
    expect(() => normalizeAttributeValue(number, "много")).toThrow(
      "Характеристика «Мощность»: «много» — не число",
    );
  });

  it("да/нет → true/false", () => {
    expect(normalizeAttributeValue(boolean, "Да")?.value).toBe("true");
    expect(normalizeAttributeValue(boolean, "false")?.handle).toBe("false");
    expect(() => normalizeAttributeValue(boolean, "наверное")).toThrow(
      "не да/нет",
    );
  });
});
