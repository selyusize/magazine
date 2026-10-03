import { z } from "@medusajs/framework/zod";

import { CONTENT_FIELDS } from "./content-plan";

/**
 * Схемы JSON-полей таблиц обмена: Query отдаёт их как `unknown`/`Record`, читаем через разбор, а не приведением.
 * Не подошло (старый формат) — значение по умолчанию: снимок пустой, счётчиков нет.
 */

/** `exchange_product.imported` — что импорт записал в карточку в прошлый раз. */
export const ContentSnapshotSchema = z
  .object({
    title: z.string(),
    description: z.string().nullable(),
    images: z.array(z.string()),
    category_id: z.string().nullable(),
    brand_id: z.string().nullable(),
  })
  .partial();

/** `exchange_product.manual_fields`. */
export const ContentFieldsSchema = z.array(z.enum(CONTENT_FIELDS));

/** `import_run.stats`: `{ products: { created: 3 } }`. */
export const RunStatsSchema = z.record(z.string(), z.record(z.string(), z.number()));

/** `import_run.errors`. */
export const RunErrorsSchema = z.array(z.object({ external_id: z.string().nullable(), message: z.string() }));

/** Разобранное значение или `fallback`. */
export function parseOr<S extends z.ZodType>(schema: S, value: unknown, fallback: z.infer<S>): z.infer<S> {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
