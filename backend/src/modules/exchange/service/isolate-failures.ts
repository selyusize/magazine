import { toError } from "@shared/service/error/error-message";

/**
 * Пачка упала — повторяем по одной записи, чтобы одна битая запись не остановила остальные. Запись, которая падает
 * и одна, уходит в `onError` (лог запуска). Сама пачка — транзакция workflow: при падении она уже откатилась.
 */
export async function isolateFailures<T>(
  items: T[],
  run: (items: T[]) => Promise<void>,
  onError: (item: T, error: Error) => void,
): Promise<void> {
  try {
    await run(items);
  } catch (error) {
    if (items.length === 1) {
      onError(items[0], toError(error));
      return;
    }
    for (const item of items) await isolateFailures([item], run, onError);
  }
}
