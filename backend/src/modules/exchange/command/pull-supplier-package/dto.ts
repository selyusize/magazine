/** Запуск с пакетом: `queued` — скачан и ждёт worker, `failed` — скачать не удалось (причина — в запуске). */
export type PulledSupplierPackageDTO = {
  id: string;
  status: "queued" | "failed";
};
