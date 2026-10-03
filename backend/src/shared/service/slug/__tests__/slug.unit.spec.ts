import { SLUG_MAX_LENGTH, SLUG_PATTERN, toSlug, toUniqueSlug } from "../slug";

describe("toSlug", () => {
  it("транслитерирует русский текст", () => {
    expect(toSlug("Футболка хлопковая, 3XL")).toBe("futbolka-hlopkovaya-3xl");
    expect(toSlug("Щётка для чистки обуви")).toBe("schetka-dlya-chistki-obuvi");
    expect(toSlug("Подъёмник — объём 5 л")).toBe("podemnik-obem-5-l");
    expect(toSlug("Юбка «Ясность» & Эхо")).toBe("yubka-yasnost-eho");
  });

  it("оставляет латиницу и снимает диакритику", () => {
    expect(toSlug("Crème Brûlée Straße")).toBe("creme-brulee-strasse");
    expect(toSlug("Medusa T-Shirt")).toBe("medusa-t-shirt");
  });

  it("принимает handle, который Medusa собрала из кириллицы", () => {
    expect(toSlug("футболка-хлопковая-3xl")).toBe("futbolka-hlopkovaya-3xl");
  });

  it("убирает лишние дефисы и пустой результат", () => {
    expect(toSlug("  --Привет!!!  мир--  ")).toBe("privet-mir");
    expect(toSlug("!!! ★ ???")).toBe("");
  });

  it("режет длинный текст по границе слова", () => {
    const slug = toSlug("очень ".repeat(40) + "длинное название");
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug).toMatch(SLUG_PATTERN);
    expect(slug.endsWith("ochen")).toBe(true);
  });
});

describe("toUniqueSlug", () => {
  it("добавляет суффикс, пока slug занят", async () => {
    const taken = new Set(["futbolka", "futbolka-2"]);
    await expect(
      toUniqueSlug("futbolka", async (slug) => taken.has(slug)),
    ).resolves.toBe("futbolka-3");
    await expect(
      toUniqueSlug("kepka", async (slug) => taken.has(slug)),
    ).resolves.toBe("kepka");
  });

  it("не превышает максимальную длину с суффиксом", async () => {
    const long = "a".repeat(SLUG_MAX_LENGTH);
    const slug = await toUniqueSlug(
      long,
      async (candidate) => candidate === long,
    );
    expect(slug).toBe("a".repeat(SLUG_MAX_LENGTH - 2) + "-2");
  });
});
