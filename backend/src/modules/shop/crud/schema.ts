import { z } from "@medusajs/framework/zod";

import { ShopSettingsSchema } from "@shared/shop/shop-settings";
import { ShopSlugSchema } from "@shared/shop/shop-slug";

const LABEL = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";

/** Домен без протокола и пути: `olisa.ru`, `shop.example.com`, в dev — `localhost:3000`. */
const DomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(
    new RegExp(`^${LABEL}(?:\\.${LABEL})*(?::\\d{1,5})?$`),
    "Домен без протокола и пути: olisa.ru",
  );

const fields = {
  name: z.string().trim().min(1).max(200),
  domain: DomainSchema,
  storefront_url: z.url({ protocol: /^https?$/ }).max(2000),
  settings: ShopSettingsSchema.optional(),
};

/** Создание: slug задаётся один раз — он префикс handle всех товаров и категорий магазина. */
export const CreateShopSchema = z.object({ slug: ShopSlugSchema, ...fields });

/** Изменение: slug менять нельзя, удаления нет — магазин выключают (`is_active: false`). */
export const UpdateShopSchema = z
  .strictObject({ ...fields, is_active: z.boolean() })
  .partial();

export type CreateShopBody = z.infer<typeof CreateShopSchema>;
