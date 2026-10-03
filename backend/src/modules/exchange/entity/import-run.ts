import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/**
 * Запуск импорта CommerceML: пакет поставщика в `backend/exchange/<dir>` (push от 1С или pull по расписанию),
 * его разбор и итог. `receiving` — 1С ещё досылает файлы, `queued` — ждёт worker, `running` — идёт обработка
 * (`heartbeat_at` обновляется на каждой пачке: зависший запуск подхватит job), `done` / `failed` — итог.
 * `cursor` — сколько записей текущего файла уже обработано: с него запуск продолжается после падения.
 */
export const ImportRun = model
  .define("import_run", {
    id: model.id({ prefix: "imprun" }).primaryKey(),
    supplier_id: model.text().index(),
    source: model.enum(["push", "pull", "manual"]),
    status: model
      .enum(["receiving", "queued", "running", "done", "failed"])
      .default("queued"),
    /** Папка пакета относительно `backend/exchange`: `<supplier_id>/<run_id>`. */
    dir: model.text(),
    /** XML-файлы пакета в порядке обработки (после распаковки). */
    files: model.json<string[]>().default([]),
    /** Только изменения (`СодержитТолькоИзменения`): отсутствующие в файле предложения не обнуляются. */
    only_changes: model.boolean().default(false),
    /** Текущий файл и сколько записей в нём обработано. */
    current_file: model.text().nullable(),
    cursor: model.number().default(0),
    /** Счётчики: `{ products: { created, updated, skipped, failed }, offers: {...} }`. */
    stats: model.json<Record<string, Record<string, number>>>().default({}),
    /** Ошибки по товарам и предложениям (не больше сотни последних). */
    errors: model
      .json<{ external_id: string | null; message: string }[]>()
      .default([]),
    message: model.text().nullable(),
    started_at: model.dateTime().nullable(),
    finished_at: model.dateTime().nullable(),
    heartbeat_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["supplier_id", "status"] }]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type ImportRunEntity = InferTypeOf<typeof ImportRun>;
