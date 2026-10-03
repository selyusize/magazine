/** Текст пойманной ошибки: в `catch` прилетает `unknown`, не обязательно `Error`. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Пойманное как `Error` — для передачи дальше (лог, ошибки запуска импорта). */
export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
