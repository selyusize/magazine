import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Посадочная «категория + значения фильтров» (`Кроссовки Nike`): своя индексируемая страница
 * `/catalog/{категория}/{handle}`. Handle уникален внутри категории. `filters` — `{ код фильтра: [значения] }`,
 * код — `handle` характеристики (модуль attribute), значение — `handle` её значения.
 */
export const FilterPage = model
  .define("filter_page", {
    id: model.id({ prefix: "fpage" }).primaryKey(),
    category_id: model.text().index(),
    title: model.text().searchable(),
    handle: model.text(),
    filters: model.json().default({}),
    is_active: model.boolean().default(true),
  })
  .indexes([{ on: ["category_id", "handle"], unique: true }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type FilterPageEntity = InferTypeOf<typeof FilterPage>;
