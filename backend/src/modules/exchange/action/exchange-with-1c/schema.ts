import { z } from "@medusajs/framework/zod";

/** Параметры протокола 1С. Имя файла — без каталогов выше пакета: пакет не должен выходить за свою папку. */
export const ExchangeWith1CSchema = z.object({
  type: z.enum(["catalog", "sale"]),
  mode: z.enum(["checkauth", "init", "file", "import", "query", "success"]),
  filename: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((name) => !name.split(/[\\/]/).includes("..") && !/^([a-z]:)?[\\/]/i.test(name), {
      message: "Недопустимое имя файла",
    })
    .optional(),
});

export type ExchangeWith1CParams = z.infer<typeof ExchangeWith1CSchema>;
