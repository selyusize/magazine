import { z } from "@medusajs/framework/zod";

import { parseRedirectsCSV } from "../../service/redirects-csv";

/**
 * Текст CSV-файла (`откуда;куда;код`): админка читает файл в браузере и присылает содержимое.
 * Разбор — здесь же: ошибка с номером строки уходит ответом 400.
 */
export const ImportRedirectsSchema = z
  .object({
    csv: z
      .string()
      .min(1)
      .max(5 * 1024 * 1024),
  })
  .transform(({ csv }) => ({ redirects: parseRedirectsCSV(csv) }));

export type ImportRedirectsBody = z.infer<typeof ImportRedirectsSchema>;
