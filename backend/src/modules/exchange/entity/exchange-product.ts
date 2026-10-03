import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Товар поставщика (`Каталог/Товары/Товар`, `Ид`) и его карточка в магазине.
 *
 * - `data` + `content_hash` — последние данные из выгрузки: тот же хэш — товар пропускается (повторный импорт
 *   того же файла ничего не меняет). До первого предложения карточки нет (`product_id = null`).
 * - `is_owner` — карточку создал этот поставщик, и он обновляет её содержимое. Поставщик, чей товар склеился
 *   с чужой карточкой (штрихкод, артикул + бренд), только добавляет свои предложения.
 * - `imported` — что импорт записал в карточку в прошлый раз. Поле карточки отличается от снимка — его правили
 *   в админке: оно попадает в `manual_fields`, и импорт его больше не трогает.
 * - `problems` — почему товар в очереди «требует разбора»: `unmapped_group`, `no_image`, `no_price`, `not_published`.
 */
export const ExchangeProduct = model
  .define("exchange_product", {
    id: model.id({ prefix: "exprod" }).primaryKey(),
    supplier_id: model.text(),
    external_id: model.text(),
    product_id: model.text().index().nullable(),
    is_owner: model.boolean().default(false),
    is_deleted: model.boolean().default(false),
    content_hash: model.text().nullable(),
    data: model.json().default({}),
    imported: model.json().default({}),
    manual_fields: model.json<string[]>().default([]),
    problems: model.json<string[]>().default([]),
    /** Есть причины в `problems` — товар в очереди «требует разбора» (индекс для списка в админке). */
    needs_review: model.boolean().default(false).index(),
  })
  .indexes([
    {
      on: ["supplier_id", "external_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ExchangeProductEntity = InferTypeOf<typeof ExchangeProduct>;
