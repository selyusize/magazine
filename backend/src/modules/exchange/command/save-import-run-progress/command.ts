import type { ImportRunPatch } from "../../step/update-import-run";

/**
 * Ход запуска после каждой пачки: файл, сколько записей в нём обработано (с этого места запуск продолжится после
 * падения), счётчики и ошибки целиком, отметка «жив». Первая отметка переводит запуск в `running`.
 */
export type SaveImportRunProgressCommand = {
  id: string;
  patch: Omit<ImportRunPatch, "finished_at">;
};
