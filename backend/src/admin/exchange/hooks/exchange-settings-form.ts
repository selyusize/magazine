import { oneOf } from "../../lib/narrow";
import type { ExchangeSupplier } from "./exchange-api";

export const EXCHANGE_MODES = ["off", "push", "pull"] as const;
export type ExchangeMode = (typeof EXCHANGE_MODES)[number];

/** Форма настроек обмена: всё строками (как в инпутах), ссылки pull — по одной на строку. */
export type ExchangeSettingsForm = {
  mode: ExchangeMode;
  login: string;
  password: string;
  urls: string;
  url_login: string;
  url_password: string;
  pull_interval_minutes: string;
  purchase_price_type: string;
  retail_price_type: string;
  markup_percent: string;
  publish: boolean;
  brand_property: string;
};

const text = (value: unknown) => (typeof value === "string" ? value : "");
const number = (value: unknown) => (typeof value === "number" ? String(value) : "");

/** Настройки поставщика → форма; пустой JSON — обмен выключен. */
export function toExchangeSettingsForm(supplier: Pick<ExchangeSupplier, "exchange" | "markup">): ExchangeSettingsForm {
  const exchange = supplier.exchange ?? {};
  return {
    mode: oneOf(exchange.mode, EXCHANGE_MODES, "off"),
    login: text(exchange.login),
    password: text(exchange.password),
    urls: Array.isArray(exchange.urls) ? exchange.urls.filter((url) => typeof url === "string").join("\n") : "",
    url_login: text(exchange.url_login),
    url_password: text(exchange.url_password),
    pull_interval_minutes: number(exchange.pull_interval_minutes),
    purchase_price_type: text(exchange.purchase_price_type),
    retail_price_type: text(exchange.retail_price_type),
    markup_percent: number(supplier.markup?.percent),
    publish: exchange.publish === true,
    brand_property: text(exchange.brand_property),
  };
}

/**
 * Форма → тело `POST /admin/suppliers/:id`: `exchange` целиком (пустое — `null`), наценка — поле `percent`
 * поверх прочих правил `markup` (их добавит этап 5).
 */
export function toExchangeSettingsBody(
  form: ExchangeSettingsForm,
  markup: Record<string, unknown>,
): { exchange: Record<string, unknown>; markup: Record<string, unknown> } {
  const optional = (value: string) => value.trim() || null;
  const interval = Number(form.pull_interval_minutes);
  const percent = Number(form.markup_percent.replace(",", "."));
  const { percent: _previous, ...rules } = markup;

  return {
    exchange: {
      mode: form.mode,
      login: optional(form.login),
      password: optional(form.password),
      urls: form.urls
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean),
      url_login: optional(form.url_login),
      url_password: optional(form.url_password),
      ...(form.pull_interval_minutes.trim() && Number.isFinite(interval) ? { pull_interval_minutes: interval } : {}),
      purchase_price_type: optional(form.purchase_price_type),
      retail_price_type: optional(form.retail_price_type),
      publish: form.publish,
      brand_property: optional(form.brand_property),
    },
    markup: form.markup_percent.trim() && Number.isFinite(percent) ? { ...rules, percent } : rules,
  };
}

/** Адрес обмена для настройки 1С («Обмен с сайтом»). */
export function exchangeURL(origin: string, supplierId: string): string {
  return `${origin.replace(/\/+$/, "")}/1c/exchange/${supplierId}`;
}
