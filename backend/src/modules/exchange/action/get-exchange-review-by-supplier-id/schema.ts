import { z } from "@medusajs/framework/zod";

export const GetExchangeReviewBySupplierIdSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetExchangeReviewBySupplierIdParams = z.infer<typeof GetExchangeReviewBySupplierIdSchema>;
