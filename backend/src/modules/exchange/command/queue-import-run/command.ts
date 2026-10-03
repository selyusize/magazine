/**
 * Поставить запуск в очередь worker, если его статус — один из `from`: 1С закончила слать файлы (`receiving`),
 * админ повторяет упавший (`failed`), job подхватывает зависший (`queued`, `running`).
 */
export type QueueImportRunCommand = {
  id: string;
  from: ("receiving" | "queued" | "running" | "failed")[];
};
