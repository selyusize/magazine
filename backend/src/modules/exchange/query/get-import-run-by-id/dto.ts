/** Запуск импорта: статус, ход, счётчики и ошибки — для админки и обработчика запуска. */
export type ImportRunDTO = {
  id: string;
  supplier_id: string;
  supplier_name: string | null;
  source: "push" | "pull" | "manual";
  status: "receiving" | "queued" | "running" | "done" | "failed";
  dir: string;
  files: string[];
  only_changes: boolean;
  current_file: string | null;
  cursor: number;
  stats: Record<string, Record<string, number>>;
  errors: { external_id: string | null; message: string }[];
  message: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  heartbeat_at: Date | null;
  created_at: Date;
};
