/** Итог запуска: `done` (в том числе с ошибками по отдельным товарам) или `failed` — пакет не разобран. */
export type FinishImportRunCommand = {
  id: string;
  status: "done" | "failed";
  message: string | null;
};
