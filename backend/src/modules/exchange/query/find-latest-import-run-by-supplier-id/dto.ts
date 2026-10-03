/** Последний запуск поставщика — для ответа 1С на `mode=import` (идёт / готово / ошибка). */
export type LatestImportRunDTO = {
  id: string;
  status: "receiving" | "queued" | "running" | "done" | "failed";
  message: string | null;
};
