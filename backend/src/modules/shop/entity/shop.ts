import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Магазин сети: свой фронт, домен, каталог и настройки на общем бэкенде. Связан 1:1 с sales channel Medusa и
 * своим publishable-ключом (`src/links/shop-*.ts`) — по ключу Store API узнаёт магазин запроса.
 */
export const Shop = model.define("shop", {
  id: model.id({ prefix: "shop" }).primaryKey(),
  /** Префикс handle сущностей Medusa (`olisa--utyug-philips`) — после создания не меняется. */
  slug: model.text().unique(),
  name: model.text().searchable(),
  /** Домен витрины без протокола (`olisa.ru`): по нему же CORS и письма. */
  domain: model.text().unique(),
  storefront_url: model.text(),
  /** Выключенный магазин не обслуживается Store API; удаления нет — заказы и покупатели остаются. */
  is_active: model.boolean().default(true),
  /** Корень своего дерева категорий — создаётся вместе с магазином. */
  root_category_id: model.text(),
  /** Схема — `ShopSettingsSchema` в `src/shared/shop/shop-settings.ts`. */
  settings: model.json().default({}),
});

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ShopEntity = InferTypeOf<typeof Shop>;
