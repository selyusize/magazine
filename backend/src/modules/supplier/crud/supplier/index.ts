import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";

import { SUPPLIER_MODULE } from "../../index";
import type { SupplierDTO } from "./dto";
import { CreateSupplierSchema, UpdateSupplierSchema } from "./schema";

const nullable = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toSupplierDTO = (row: CRUDRow): SupplierDTO => ({
  id: row.id,
  name: String(row.name),
  contact_name: nullable(row.contact_name),
  phone: nullable(row.phone),
  email: nullable(row.email),
  order_email: nullable(row.order_email),
  order_api_url: nullable(row.order_api_url),
  ship_city: String(row.ship_city),
  ship_address: nullable(row.ship_address),
  assembly_days: Number(row.assembly_days),
  is_active: Boolean(row.is_active),
  exchange: (row.exchange as SupplierDTO["exchange"] | null) ?? {},
  markup: (row.markup as SupplierDTO["markup"] | null) ?? {},
  stock_location_id: nullable(row.stock_location_id),
  created_at: new Date(row.created_at as string),
  updated_at: new Date(row.updated_at as string),
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
