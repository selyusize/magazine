import { parseShopSettings, ShopSettingsSchema } from "../shop-settings";

describe("ShopSettingsSchema", () => {
  it("пустые настройки допустимы — магазин заполняют после создания", () => {
    expect(ShopSettingsSchema.parse({})).toEqual({});
  });

  it("принимает контакты и логотип", () => {
    const settings = {
      contacts: {
        phone: "+7 800 000-00-00",
        email: "info@olisa.ru",
        address: "Москва",
      },
      logo_url: "https://olisa.ru/logo.svg",
    };
    expect(ShopSettingsSchema.parse(settings)).toEqual(settings);
  });

  it("отбрасывает неизвестные поля", () => {
    expect(ShopSettingsSchema.parse({ unknown: 1 })).toEqual({});
  });

  it.each([
    ["email без @", { contacts: { email: "olisa.ru" } }],
    ["логотип не URL", { logo_url: "logo.svg" }],
    ["пустой телефон", { contacts: { phone: " " } }],
  ])("отклоняет: %s", (_reason, settings) => {
    expect(ShopSettingsSchema.safeParse(settings).success).toBe(false);
  });
});

describe("parseShopSettings", () => {
  it("читает корректный JSON из БД", () => {
    expect(
      parseShopSettings({ logo_url: "https://olisa.ru/logo.svg" }),
    ).toEqual({
      logo_url: "https://olisa.ru/logo.svg",
    });
  });

  it.each([null, undefined, "строка", { logo_url: 42 }])(
    "некорректное значение %p — пустые настройки",
    (value) => {
      expect(parseShopSettings(value)).toEqual({});
    },
  );
});
