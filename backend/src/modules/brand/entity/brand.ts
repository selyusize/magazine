import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Бренд (производитель) магазина `shop_id`: своя страница `/brands/{handle}` и фильтр в каталоге. Handle пока
 * уникален на всю сеть — пары `(shop_id, handle)` и пути витрины по магазинам вводит шаг 4–5 плана.
 */
export const Brand = model.define("brand", {
  id: model.id({ prefix: "brand" }).primaryKey(),
  shop_id: model.text().index(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  description: model.text().nullable(),
  is_active: model.boolean().default(true),
  /** Другие написания из выгрузок поставщиков («Найк», «NIKE Inc.») — импорт находит по ним этот бренд. */
  synonyms: model.json<string[]>().default([]),
});

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type BrandEntity = InferTypeOf<typeof Brand>;
