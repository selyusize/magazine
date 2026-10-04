import { CreateShopSchema, UpdateShopSchema } from "../schema";

const valid = {
  slug: "olisa",
  name: "Olisa",
  domain: "olisa.ru",
  storefront_url: "https://olisa.ru",
};

describe("CreateShopSchema", () => {
  it("принимает магазин без настроек", () => {
    expect(CreateShopSchema.parse(valid)).toEqual(valid);
  });

  it.each(["olisa.ru", "shop.example.com", "localhost:3000", "my-shop.rf"])(
    "принимает домен «%s»",
    (domain) => {
      expect(CreateShopSchema.safeParse({ ...valid, domain }).success).toBe(
        true,
      );
    },
  );

  it("приводит домен к нижнему регистру", () => {
    expect(
      CreateShopSchema.parse({ ...valid, domain: "Olisa.RU" }).domain,
    ).toBe("olisa.ru");
  });

  it.each([
    "https://olisa.ru",
    "olisa.ru/catalog",
    "olisa ru",
    "-olisa.ru",
    "",
  ])("отклоняет домен «%s»", (domain) => {
    expect(CreateShopSchema.safeParse({ ...valid, domain }).success).toBe(
      false,
    );
  });

  it.each(["ftp://olisa.ru", "olisa.ru"])(
    "отклоняет адрес витрины «%s»",
    (storefront_url) => {
      expect(
        CreateShopSchema.safeParse({ ...valid, storefront_url }).success,
      ).toBe(false);
    },
  );

  it("отклоняет некорректный slug", () => {
    expect(
      CreateShopSchema.safeParse({ ...valid, slug: "Olisa Shop" }).success,
    ).toBe(false);
  });
});

describe("UpdateShopSchema", () => {
  it("принимает частичное изменение и выключение", () => {
    expect(UpdateShopSchema.parse({ is_active: false })).toEqual({
      is_active: false,
    });
  });

  it("не даёт сменить slug — это префикс всех handle магазина", () => {
    expect(UpdateShopSchema.safeParse({ slug: "other" }).success).toBe(false);
  });
});
