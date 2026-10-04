import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

import { SupplierOffer } from "./supplier-offer";

/**
 * Поставщик (дропшиппинг): откуда приходят каталог, закупочные цены и остатки (CommerceML, этап 4) и кому уходят
 * заказы (этап 15). На каждого — свой виртуальный склад Medusa (`stock_location_id`, создаёт подписчик на
 * `supplier.created`): остатки его предложений лежат там уровнями inventory, и стандартные резервы и наличие
 * в корзине работают без своего склада.
 *
 * Поставщик принадлежит одному магазину (`shop_id`, после создания не меняется): его товары, склад, бренды и
 * характеристики из выгрузки живут в этом магазине.
 */
export const Supplier = model
  .define("supplier", {
    id: model.id({ prefix: "sup" }).primaryKey(),
    shop_id: model.text().index(),
    name: model.text().searchable(),
    contact_name: model.text().nullable(),
    phone: model.text().nullable(),
    email: model.text().nullable(),
    /** Куда отправлять заказы: почта менеджера и/или API поставщика (этап 15). */
    order_email: model.text().nullable(),
    order_api_url: model.text().nullable(),
    /** Город и адрес отгрузки — адрес склада поставщика, от него перевозчики считают доставку. */
    ship_city: model.text(),
    ship_address: model.text().nullable(),
    /** Срок сборки заказа у поставщика, дней — часть срока доставки на карточке (этап 5.6). */
    assembly_days: model.number().default(1),
    /** Выключенный поставщик не продаёт: остатки его предложений на складе обнуляются. */
    is_active: model.boolean().default(true),
    /** Источник CommerceML: push/pull, адрес, доступы, тип цены (этап 4). */
    exchange: model.json().default({}),
    /** Правила наценки поставщика (этап 5). */
    markup: model.json().default({}),
    stock_location_id: model.text().nullable(),
    offers: model.hasMany(() => SupplierOffer, { mappedBy: "supplier" }),
  })
  .cascades({ delete: ["offers"] });

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type SupplierEntity = InferTypeOf<typeof Supplier>;
