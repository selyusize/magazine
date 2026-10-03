import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Группа каталога поставщика (`Классификатор/Группы`) — справочник для маппинга на категории магазина.
 * Дерево поставщика в витрину не попадает: товар получает категорию магазина `category_id` своей группы или
 * ближайшего сопоставленного предка. Не сопоставлена — товар остаётся черновиком в очереди «требует разбора».
 */
export const ExchangeGroup = model
  .define("exchange_group", {
    id: model.id({ prefix: "exgrp" }).primaryKey(),
    supplier_id: model.text(),
    external_id: model.text(),
    parent_external_id: model.text().nullable(),
    name: model.text(),
    category_id: model.text().index().nullable(),
  })
  .indexes([
    {
      on: ["supplier_id", "external_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ExchangeGroupEntity = InferTypeOf<typeof ExchangeGroup>;
