import { z } from "@medusajs/framework/zod";

export const GetImportRunsSchema = z.object({
  supplier_id: z.string().trim().min(1).optional(),
  status: z.enum(["receiving", "queued", "running", "done", "failed"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetImportRunsParams = z.infer<typeof GetImportRunsSchema>;
