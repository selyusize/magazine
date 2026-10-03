import { oneOf, recordOf } from "@shared/query/narrow";

export const EXCHANGE_MODES = ["off", "push", "pull"] as const;

/**
 * Настройки обмена поставщика (`supplier.exchange` и `supplier.markup`) в виде, удобном импорту. Поля проверяет
 * zod-схема поставщика при сохранении; здесь — разбор с умолчаниями: старые записи и пустой JSON не ломают импорт.
 */
export type ExchangeSettings = {
  /** `push` — 1С сама присылает пакеты на `/1c/exchange/:supplier`, `pull` — забираем по расписанию, `off` — выключен. */
  mode: (typeof EXCHANGE_MODES)[number];
  /** Логин и пароль 1С для push (Basic). */
  login: string | null;
  password: string | null;
  /** Pull: адреса файлов или zip (по порядку: каталог, потом предложения) и доступ к ним. */
  urls: string[];
  url_login: string | null;
  url_password: string | null;
  /** Pull: как часто забирать выгрузку, минут. */
  pull_interval_minutes: number;
  /** Закупочная цена: Ид или название типа цены; пусто — единственный или первый тип. */
  purchase_price_type: string | null;
  /** Розничная цена поставщика (Ид или название), если есть; иначе розница = закупка + наценка. */
  retail_price_type: string | null;
  /** Наценка на закупку, % (`supplier.markup.percent`); правила наценки — этап 5. */
  markup_percent: number;
  /** Публиковать новые товары, если хватает обязательных полей; иначе — черновики. */
  publish: boolean;
  /** Название свойства с брендом, если оно не «Бренд»/«Торговая марка»/«Производитель». */
  brand_property: string | null;
};

const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);
const number = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export function toExchangeSettings(exchange: unknown, markup: unknown): ExchangeSettings {
  const raw = recordOf(exchange);
  return {
    mode: oneOf(raw.mode, EXCHANGE_MODES, "off"),
    login: text(raw.login),
    password: text(raw.password),
    urls: Array.isArray(raw.urls) ? raw.urls.map(text).filter((url): url is string => url !== null) : [],
    url_login: text(raw.url_login),
    url_password: text(raw.url_password),
    pull_interval_minutes: Math.max(5, number(raw.pull_interval_minutes, 60)),
    purchase_price_type: text(raw.purchase_price_type),
    retail_price_type: text(raw.retail_price_type),
    markup_percent: number(recordOf(markup).percent, 0),
    publish: raw.publish === true,
    brand_property: text(raw.brand_property),
  };
}
