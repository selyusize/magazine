/** Созданный запуск: куда класть файлы пакета (`dir` — относительно хранилища обмена). */
export type StartedImportRunDTO = {
  id: string;
  supplier_id: string;
  dir: string;
  status: "receiving" | "queued";
};
