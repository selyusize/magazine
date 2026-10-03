/** Статус после команды; `queued: false` — статус был другим, ничего не поменялось. */
export type QueuedImportRunDTO = {
  id: string;
  status: "receiving" | "queued" | "running" | "done" | "failed";
  queued: boolean;
};
