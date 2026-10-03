import { z } from "@medusajs/framework/zod";

export const FindRedirectByPathSchema = z.object({
  path: z.string().trim().min(1).max(2048),
});

export type FindRedirectByPathParams = z.infer<typeof FindRedirectByPathSchema>;
