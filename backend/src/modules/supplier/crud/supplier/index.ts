import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";
import { isString, numberOr, recordOf, text, textOrNull, toDate } from "@shared/query/narrow";

import { SUPPLIER_MODULE } from "../../index";
import type { SupplierDTO } from "./dto";
import { CreateSupplierSchema, UpdateSupplierSchema } from "./schema";

type Setting = SupplierDTO["exchange"][string];

const isSetting = (value: unknown): value is Setting =>
  value === null ||
  ["string", "number", "boolean"].includes(typeof value) ||
  (Array.isArray(value) && value.every(isString));

/** Плоские настройки из JSON-поля: значения других типов отбрасываются. */
const settingsOf = (value: unknown): Record<string, Setting> =>
  Object.fromEntries(
    Object.entries(recordOf(value)).filter((entry): entry is [string, Setting] => isSetting(entry[1])),
  );

/** Наценка — без списков (`ExchangeSchema` их допускает только в обмене). */
const markupOf = (value: unknown): SupplierDTO["markup"] =>
  Object.fromEntries(
    Object.entries(settingsOf(value)).filter(
      (entry): entry is [string, string | number | boolean | null] => !Array.isArray(entry[1]),
    ),
  );

const toSupplierDTO = (row: CRUDRow): SupplierDTO => ({
  id: row.id,
  name: text(row.name),
  contact_name: textOrNull(row.contact_name),
  phone: textOrNull(row.phone),
  email: textOrNull(row.email),
  order_email: textOrNull(row.order_email),
  order_api_url: textOrNull(row.order_api_url),
  ship_city: text(row.ship_city),
  ship_address: textOrNull(row.ship_address),
  assembly_days: numberOr(row.assembly_days),
  is_active: Boolean(row.is_active),
  exchange: settingsOf(row.exchange),
  markup: markupOf(row.markup),
  stock_location_id: textOrNull(row.stock_location_id),
  created_at: toDate(row.created_at),
  updated_at: toDate(row.updated_at),
});

/**
 * CRUD поставщиков для админки — /admin/suppliers. Страницы на витрине у поставщика нет. События `supplier.*` →
 * склад поставщика и остатки на нём (`sync-stock-location-for-supplier`, `sync-inventory-for-supplier`);
 * удаление мягкое и уносит его предложения.
 */
export const supplierCRUD = defineCRUD<SupplierDTO>({
  entity: "supplier",
  module: SUPPLIER_MODULE,
  model: "Supplier",
  label: "поставщик",
  shopScoped: true,
  response: { one: "supplier", many: "suppliers" },
  fields: [
    "id",
    "name",
    "contact_name",
    "phone",
    "email",
    "order_email",
    "order_api_url",
    "ship_city",
    "ship_address",
    "assembly_days",
    "is_active",
    "exchange",
    "markup",
    "stock_location_id",
    "created_at",
    "updated_at",
  ],
  search: ["name", "ship_city"],
  order: { name: "ASC" },
  schemas: { create: CreateSupplierSchema, update: UpdateSupplierSchema },
  toDTO: toSupplierDTO,
});
