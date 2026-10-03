import { z } from "@medusajs/framework/zod";

export const GetRedirectsForAdminSchema = z.object({
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetRedirectsForAdminParams = z.infer<
  typeof GetRedirectsForAdminSchema
>;
