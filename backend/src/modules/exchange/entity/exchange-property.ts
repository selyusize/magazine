import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Свойство товаров поставщика (`Классификатор/Свойства`) и его справочник значений `{ <ИдЗначения>: "Хлопок" }`.
 * `attribute_id` — характеристика магазина: задаётся в админке или само, если названия совпали. Без неё значения
 * не теряются — ложатся в `metadata.supplier_properties` товара.
 */
export const ExchangeProperty = model
  .define("exchange_property", {
    id: model.id({ prefix: "exprop" }).primaryKey(),
    supplier_id: model.text(),
    external_id: model.text(),
    name: model.text(),
    values: model.json<Record<string, string>>().default({}),
    attribute_id: model.text().index().nullable(),
  })
  .indexes([
    {
      on: ["supplier_id", "external_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ExchangePropertyEntity = InferTypeOf<typeof ExchangeProperty>;
