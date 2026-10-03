import { z } from "@medusajs/framework/zod";

/** Плоские настройки наценки: структуру уточнит этап 5 (`percent` — наценка на закупку, %). */
const SettingsSchema = z.record(
  z.string().trim().min(1).max(100),
  z.union([z.string().max(2000), z.number(), z.boolean(), z.null()]),
);

const text = (max: number) => z.string().trim().max(max).nullable().optional();

/**
 * Обмен CommerceML (этап 4): `push` — 1С шлёт пакеты на `/1c/exchange/:id` (логин и пароль — для Basic), `pull` —
 * магазин забирает файлы по `urls` (по порядку: каталог, затем предложения) раз в `pull_interval_minutes`.
 * Типы цен — Ид или название из выгрузки; `publish` — публиковать готовые новые товары.
 */
const ExchangeSchema = z.object({
  mode: z.enum(["off", "push", "pull"]).optional(),
  login: text(200),
  password: text(200),
  urls: z.array(z.url().max(2000)).max(20).optional(),
  url_login: text(200),
  url_password: text(200),
  pull_interval_minutes: z.number().int().min(5).max(10_080).optional(),
  purchase_price_type: text(200),
  retail_price_type: text(200),
  publish: z.boolean().optional(),
  brand_property: text(200),
});

const fields = {
  name: z.string().trim().min(1).max(200),
  contact_name: text(200),
  phone: text(50),
  email: z.email().max(200).nullable().optional(),
  order_email: z.email().max(200).nullable().optional(),
  order_api_url: z.url().max(2000).nullable().optional(),
  ship_city: z.string().trim().min(1).max(200),
  ship_address: text(500),
  assembly_days: z.number().int().min(0).max(365).optional(),
  is_active: z.boolean().optional(),
  exchange: ExchangeSchema.optional(),
  markup: SettingsSchema.optional(),
};

export const CreateSupplierSchema = z.object(fields);
export const UpdateSupplierSchema = z.object(fields).partial();
