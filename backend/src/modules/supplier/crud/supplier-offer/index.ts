import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";

import { SUPPLIER_MODULE } from "../../index";
import type { SupplierOfferDTO } from "./dto";
import { CreateSupplierOfferSchema, UpdateSupplierOfferSchema } from "./schema";

const nullable = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toSupplierOfferDTO = (row: CRUDRow): SupplierOfferDTO => {
  const supplier = row.supplier as { name: string } | null | undefined;
  const variant = row.product_variant as
    | { title: string; sku: string | null; product_id: string }
    | null
    | undefined;
  return {
    id: row.id,
    supplier_id: String(row.supplier_id),
    supplier: supplier ? { name: supplier.name } : null,
    variant_id: String(row.variant_id),
    variant: variant
      ? {
          title: variant.title,
          sku: variant.sku ?? null,
          product_id: variant.product_id,
        }
      : null,
    external_id: String(row.external_id),
    sku: nullable(row.sku),
    barcode: nullable(row.barcode),
    purchase_price:
      row.purchase_price === null || row.purchase_price === undefined
        ? null
        : Number(row.purchase_price),
    quantity: Number(row.quantity),
    synced_at: row.synced_at ? new Date(row.synced_at as string) : null,
    created_at: new Date(row.created_at as string),
    updated_at: new Date(row.updated_at as string),
  };
};

/**
 * CRUD предложений поставщиков — /admin/supplier-offers (`?supplier_id=`, `?variant_id=`). Создание — отдельным
 * use‑case `create-supplier-offer` (проверяет вариант и поставщика) поверх workflow фабрики. События
 * `supplier_offer.*` → остатки варианта на складах поставщиков (`sync-inventory-for-offers`).
 * Вариант — через read-only связь `src/links/supplier-offer-product-variant.ts`.
 */
export const supplierOfferCRUD = defineCRUD<SupplierOfferDTO>({
  entity: "supplier_offer",
  module: SUPPLIER_MODULE,
  model: "SupplierOffer",
  label: "предложение поставщика",
  response: { one: "supplier_offer", many: "supplier_offers" },
  fields: [
    "id",
    "supplier_id",
    "supplier.name",
    "variant_id",
    "product_variant.title",
    "product_variant.sku",
    "product_variant.product_id",
    "external_id",
    "sku",
    "barcode",
    "purchase_price",
    "quantity",
    "synced_at",
    "created_at",
    "updated_at",
  ],
  search: ["external_id", "sku", "barcode"],
  filters: ["supplier_id", "variant_id"],
  schemas: {
    create: CreateSupplierOfferSchema,
    update: UpdateSupplierOfferSchema,
  },
  toDTO: toSupplierOfferDTO,
});
