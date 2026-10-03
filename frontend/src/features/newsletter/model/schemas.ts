import { errorMessages } from "@shared/lib/errors";
import { z } from "@shared/lib/zod";

export const newsletterSchema = z.object({
  email: z.email({ error: errorMessages.email }),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
