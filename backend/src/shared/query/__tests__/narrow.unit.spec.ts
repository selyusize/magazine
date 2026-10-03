import {
  dateOrNull,
  isRecord,
  numberOrNull,
  oneOf,
  oneOfOrNull,
  records,
  recordOrNull,
  text,
  textOrNull,
  textRecord,
  texts,
  toDate,
} from "../narrow";

describe("сужение неизвестных значений", () => {
  it("объекты, строки, числа (и bigNumber строкой)", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(recordOrNull("x")).toBeNull();
    expect(text(1, "—")).toBe("—");
    expect(textOrNull("a")).toBe("a");
    expect(numberOrNull("12.5")).toBe(12.5);
    expect(numberOrNull("")).toBeNull();
    expect(numberOrNull(Number.NaN)).toBeNull();
  });

  it("даты: строка, Date, мусор", () => {
    expect(dateOrNull("2026-10-04T00:00:00.000Z")?.toISOString()).toBe("2026-10-04T00:00:00.000Z");
    expect(dateOrNull("не дата")).toBeNull();
    expect(toDate(undefined).getTime()).toBe(0);
  });

  it("массивы и словари без чужих типов", () => {
    expect(texts(["a", 1, null, "b"])).toEqual(["a", "b"]);
    expect(records([{ id: 1 }, "x", null])).toEqual([{ id: 1 }]);
    expect(textRecord({ a: "1", b: 2 })).toEqual({ a: "1" });
  });

  it("значение из списка", () => {
    expect(oneOf("pull", ["off", "push", "pull"] as const, "off")).toBe("pull");
    expect(oneOf("ftp", ["off", "push", "pull"] as const, "off")).toBe("off");
    expect(oneOfOrNull(302, [301, 302] as const)).toBe(302);
    expect(oneOfOrNull("302", [301, 302] as const)).toBeNull();
  });
});
