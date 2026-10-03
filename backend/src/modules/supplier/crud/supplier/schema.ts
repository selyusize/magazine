import { z } from "@medusajs/framework/zod";

/** Плоские настройки (обмен, наценка): структуру уточнят этапы 4 и 5. */
const SettingsSchema = z.record(
  z.string().trim().min(1).max(100),
  z.union([z.string().max(2000), z.number(), z.boolean(), z.null()]),
);

const text = (max: number) => z.string().trim().max(max).nullable().optional();

const fields = {
  name: z.string().trim().min(1).max(200),
  contact_name: text(200),
  phone: text(50),
  email: z.email().max(200).nullable().optional(),
  order_email: z.email().max(200).nullable().optional(),
  order_api_url: z.url().max(2000).nullable().optional(),
  ship_city: z.string().trim().min(1).max(200),
  ship_address: text(500),
  assembly_days: z.number().int().min(0).max(365).optional(),
  is_active: z.boolean().optional(),
  exchange: SettingsSchema.optional(),
  markup: SettingsSchema.optional(),
};

export const CreateSupplierSchema = z.object(fields);
export const UpdateSupplierSchema = z.object(fields).partial();
