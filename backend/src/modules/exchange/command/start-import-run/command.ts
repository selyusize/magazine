/**
 * Новый запуск импорта поставщика. `receiving` — 1С начала сеанс (`mode=init`) и будет досылать файлы,
 * `queued` — пакет уже на месте (pull) и запуск сразу идёт в очередь worker.
 */
export type StartImportRunCommand = {
  supplier_id: string;
  source: "push" | "pull" | "manual";
  status: "receiving" | "queued";
};
