import { z } from "@medusajs/framework/zod";

import {
  findRedirectProblem,
  normalizePath,
  REDIRECT_CODES,
} from "../../service/path";

const PathSchema = z.string().trim().min(1).max(2048).transform(normalizePath);

export const SaveRedirectSchema = z
  .object({
    from_path: PathSchema,
    /** Пусто или null — 410. */
    to_path: z
      .union([PathSchema, z.literal(""), z.null()])
      .optional()
      .transform((path) => path || null),
    code: z.literal(REDIRECT_CODES),
  })
  .superRefine((redirect, context) => {
    const problem = findRedirectProblem(redirect);
    if (problem)
      context.addIssue({ code: "custom", path: ["to_path"], message: problem });
  });

export type SaveRedirectBody = z.infer<typeof SaveRedirectSchema>;
