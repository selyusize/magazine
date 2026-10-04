import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Бренд (производитель) магазина `shop_id`: своя страница `/brands/{handle}` и фильтр в каталоге. Handle уникален
 * внутри магазина — у двух магазинов может быть бренд `philips`.
 */
export const Brand = model
  .define("brand", {
    id: model.id({ prefix: "brand" }).primaryKey(),
    shop_id: model.text(),
    name: model.text().searchable(),
    handle: model.text(),
    description: model.text().nullable(),
    is_active: model.boolean().default(true),
    /** Другие написания из выгрузок поставщиков («Найк», «NIKE Inc.») — импорт находит по ним этот бренд. */
    synonyms: model.json<string[]>().default([]),
  })
  // Индекс начинается с `shop_id` — он же для списков магазина
  .indexes([{ on: ["shop_id", "handle"], unique: true }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type BrandEntity = InferTypeOf<typeof Brand>;
