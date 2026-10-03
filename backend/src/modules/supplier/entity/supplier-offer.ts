import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

import { Supplier } from "./supplier";

/**
 * Предложение поставщика по варианту товара. Один товар у нескольких поставщиков — одна карточка (без дублей
 * страниц) и несколько предложений на её вариантах. `external_id` — `Ид` из CommerceML (`товар#характеристика`),
 * уникален у поставщика: по нему импорт обновляет предложение. Наличие варианта — сумма `quantity` предложений
 * активных поставщиков (уровни inventory на их складах).
 */
export const SupplierOffer = model
  .define("supplier_offer", {
    id: model.id({ prefix: "soff" }).primaryKey(),
    supplier: model.belongsTo(() => Supplier, { mappedBy: "offers" }),
    variant_id: model.text().index(),
    external_id: model.text(),
    /** Артикул и штрихкод поставщика — по ним склеиваются дубли между поставщиками (этап 4.3). */
    sku: model.text().index().nullable(),
    barcode: model.text().index().nullable(),
    purchase_price: model.bigNumber().nullable(),
    quantity: model.number().default(0),
    /** Когда предложение последний раз пришло в выгрузке — по нему устаревшие остатки не продаются (этап 5.4). */
    synced_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["supplier_id", "external_id"], unique: true }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type SupplierOfferEntity = InferTypeOf<typeof SupplierOffer>;
