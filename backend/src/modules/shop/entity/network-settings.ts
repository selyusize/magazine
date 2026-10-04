import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Реквизиты сети — одна строка на всю сеть (одно юрлицо): подвал витрин, Organization в schema.org, оферта, чеки.
 * Пока строки нет, `GET` отдаёт пустые значения; первая запись создаёт её (`update-network-settings`).
 */
export const NetworkSettings = model.define("network_settings", {
  id: model.id({ prefix: "nset" }).primaryKey(),
  /** Название сети для покупателя и писем: «Snowaa». */
  name: model.text().nullable(),
  /** Полное наименование: «ООО «Сноуа»», «ИП Иванов Иван Иванович». */
  legal_name: model.text().nullable(),
  inn: model.text().nullable(),
  /** ОГРН юрлица (13 цифр) или ОГРНИП (15). */
  ogrn: model.text().nullable(),
  /** У ИП КПП нет. */
  kpp: model.text().nullable(),
  /** Юридический адрес одной строкой — как в выписке ЕГРЮЛ/ЕГРИП. */
  legal_address: model.text().nullable(),
  phone: model.text().nullable(),
  email: model.text().nullable(),
});

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type NetworkSettingsEntity = InferTypeOf<typeof NetworkSettings>;
