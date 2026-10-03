import { z } from "@medusajs/framework/zod";

/** Поля, которые приходят в выгрузке и меняются при каждом обмене. */
const fields = {
  /** `Ид` из CommerceML: `товар` или `товар#характеристика`. */
  external_id: z.string().trim().min(1).max(200),
  sku: z.string().trim().max(200).nullable().optional(),
  barcode: z.string().trim().max(100).nullable().optional(),
  purchase_price: z.number().min(0).nullable().optional(),
  quantity: z.number().int().min(0).optional(),
  synced_at: z.iso.datetime({ offset: true }).nullable().optional(),
};

/** Поставщик и вариант задаются при создании и не меняются: иначе остатки остались бы на чужом складе. */
export const CreateSupplierOfferSchema = z.object({
  supplier_id: z.string().trim().min(1),
  variant_id: z.string().trim().min(1),
  ...fields,
});
export const UpdateSupplierOfferSchema = z.object(fields).partial();

export type CreateSupplierOfferBody = z.infer<typeof CreateSupplierOfferSchema>;
