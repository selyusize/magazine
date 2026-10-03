import { defineCRUD } from "@shared/crud/define-crud";
import type { CRUDRow } from "@shared/crud/definition";
import { dateOrNull, numberOr, numberOrNull, recordOrNull, text, textOrNull, toDate } from "@shared/query/narrow";

import { SUPPLIER_MODULE } from "../../index";
import type { SupplierOfferDTO } from "./dto";
import { CreateSupplierOfferSchema, UpdateSupplierOfferSchema } from "./schema";

const toSupplierOfferDTO = (row: CRUDRow): SupplierOfferDTO => {
  const supplier = recordOrNull(row.supplier);
  const variant = recordOrNull(row.product_variant);
  return {
    id: row.id,
    supplier_id: text(row.supplier_id),
    supplier: supplier ? { name: text(supplier.name) } : null,
    variant_id: text(row.variant_id),
    variant: variant
      ? {
          title: text(variant.title),
          sku: textOrNull(variant.sku),
          product_id: text(variant.product_id),
        }
      : null,
    external_id: text(row.external_id),
    sku: textOrNull(row.sku),
    barcode: textOrNull(row.barcode),
    purchase_price: numberOrNull(row.purchase_price),
    quantity: numberOr(row.quantity),
    synced_at: dateOrNull(row.synced_at),
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
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
