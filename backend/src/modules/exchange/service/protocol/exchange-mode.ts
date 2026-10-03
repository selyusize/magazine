import type { Readable } from "node:stream";

import type { ExchangeSupplierDTO } from "../../query/get-exchange-supplier-by-id/dto";

/** Запрос 1С к сайту, уже проверенный: поставщик из адреса и его права. */
export type ExchangeRequest = {
  supplier: ExchangeSupplierDTO;
  filename: string | null;
  /** Тело запроса — файл (или его часть) для `mode=file`. */
  body: Readable;
  /** Пришёл с Basic-логином и паролем поставщика (не только с cookie сессии). */
  basic: boolean;
};

/** Ответ 1С — строки текста (`success`, `progress`, `failure\nпричина`) и, после `checkauth`, cookie сессии. */
export type ExchangeReply = { lines: string[]; status?: number; session?: string };

export const failure = (message: string, status = 200): ExchangeReply => ({ lines: ["failure", message], status });

/**
 * Шаг стандартного протокола обмена 1С с сайтом (`type=catalog&mode=…`). Каждый режим — своя стратегия:
 * Action выбирает её по `mode`, новый режим добавляется классом без правок остальных.
 */
export abstract class ExchangeMode {
  abstract readonly mode: string;
  abstract handle(request: ExchangeRequest): Promise<ExchangeReply>;
}
