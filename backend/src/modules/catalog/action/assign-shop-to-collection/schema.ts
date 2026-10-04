import { z } from "@medusajs/framework/zod";

export const AssignShopToCollectionSchema = z.object({
  shop_id: z.string().trim().min(1),
});

export type AssignShopToCollectionBody = z.infer<typeof AssignShopToCollectionSchema>;
