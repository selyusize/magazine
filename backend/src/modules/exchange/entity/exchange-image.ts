import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Скачанная картинка поставщика: `source` — путь в пакете или URL у поставщика, `hash` — sha256 содержимого.
 * Тот же источник второй раз не качается, то же содержимое под другим адресом не загружается и не пережимается
 * повторно — товар получает уже сохранённый `url` (без хотлинка на поставщика).
 */
export const ExchangeImage = model
  .define("exchange_image", {
    id: model.id({ prefix: "eximg" }).primaryKey(),
    supplier_id: model.text(),
    source: model.text(),
    hash: model.text().index(),
    url: model.text(),
    file_id: model.text(),
  })
  .indexes([
    {
      on: ["supplier_id", "source"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ExchangeImageEntity = InferTypeOf<typeof ExchangeImage>;
