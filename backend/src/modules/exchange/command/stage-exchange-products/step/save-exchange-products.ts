import { createUpsertExchangeRowsStep } from "../../../step/upsert-exchange-rows";
import type { StageExchangeProductsCommand } from "../command";

type Staged = StageExchangeProductsCommand["products"][number];
/** Что шаг пишет в строку: данные выгрузки, их хэш и пометку «удалён у поставщика». */
type ProductData = { data: Record<string, unknown>; content_hash: string | null; is_deleted: boolean };

/** Данные товара и хэш; совпал хэш — строка не пишется. Карточку и снимок «что записал импорт» не трогает. */
export const saveExchangeProductsStep = createUpsertExchangeRowsStep(
  "save-exchange-products",
  (service) => ({
    list: (filters) => service.listExchangeProducts(filters),
    create: (rows) => service.createExchangeProducts(rows),
    update: (rows) => service.updateExchangeProducts(rows),
    delete: (ids) => service.deleteExchangeProducts(ids),
  }),
  (current, { content_hash, ...data }: Staged): ProductData | null =>
    current?.content_hash === content_hash ? null : { data, content_hash, is_deleted: data.deleted },
  (current): ProductData => ({ data: current.data, content_hash: current.content_hash, is_deleted: current.is_deleted }),
);
