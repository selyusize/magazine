import { exchangeURL, toExchangeSettingsBody, toExchangeSettingsForm } from "../hooks/exchange-settings-form";

describe("форма настроек обмена", () => {
  it("пустые настройки — обмен выключен, поля пустые", () => {
    expect(toExchangeSettingsForm({ exchange: {}, markup: {} })).toEqual({
      mode: "off",
      login: "",
      password: "",
      urls: "",
      url_login: "",
      url_password: "",
      pull_interval_minutes: "",
      purchase_price_type: "",
      retail_price_type: "",
      markup_percent: "",
      publish: false,
      brand_property: "",
    });
  });

  it("ссылки — по строке, пустое — null, наценка поверх прочих правил", () => {
    const form = {
      ...toExchangeSettingsForm({
        exchange: { mode: "pull", urls: ["https://a/import.xml"], pull_interval_minutes: 60 },
        markup: { percent: 10, round: 10 },
      }),
      urls: " https://a/import.xml \n\nhttps://a/offers.xml ",
      markup_percent: "12,5",
      publish: true,
    };

    expect(form.pull_interval_minutes).toBe("60");
    expect(toExchangeSettingsBody(form, { percent: 10, round: 10 })).toEqual({
      exchange: {
        mode: "pull",
        login: null,
        password: null,
        urls: ["https://a/import.xml", "https://a/offers.xml"],
        url_login: null,
        url_password: null,
        pull_interval_minutes: 60,
        purchase_price_type: null,
        retail_price_type: null,
        publish: true,
        brand_property: null,
      },
      markup: { round: 10, percent: 12.5 },
    });
  });

  it("стёртая наценка и интервал не уходят — остаются правила и значение по умолчанию", () => {
    const body = toExchangeSettingsBody(toExchangeSettingsForm({ exchange: { mode: "push" }, markup: { percent: 5 } }), {
      percent: 5,
    });
    expect(body.exchange).not.toHaveProperty("pull_interval_minutes");
    expect(toExchangeSettingsBody({ ...toExchangeSettingsForm({ exchange: {}, markup: {} }), markup_percent: "" }, { percent: 5 }).markup).toEqual({});
  });

  it("адрес обмена для 1С", () => {
    expect(exchangeURL("https://api.shop.ru/", "sup_1")).toBe("https://api.shop.ru/1c/exchange/sup_1");
  });
});
