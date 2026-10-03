import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/** Бренд (производитель): своя страница `/brands/{handle}` и фильтр в каталоге. */
export const Brand = model.define("brand", {
  id: model.id({ prefix: "brand" }).primaryKey(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  description: model.text().nullable(),
  is_active: model.boolean().default(true),
});

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type BrandEntity = InferTypeOf<typeof Brand>;
