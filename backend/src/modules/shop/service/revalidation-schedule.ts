import { mergeStorefrontTags } from "@shared/service/cache-invalidation/storefront-tags";

export type RevalidationScheduleOptions = {
  /** Окно дебаунса: вебхук уходит, когда события магазина затихли на это время, мс. */
  window_ms: number;
  /** Дольше этого от первого события пачку не держим, даже если события идут (импорт), мс. */
  max_wait_ms: number;
  /** Паузы перед повторами после 1-й, 2-й… неудачи; кончились — пачка `failed`. */
  retry_delays_ms: number[];
  /** Больше тегов сущностей в пачке — заменяются групповыми (`products`). */
  tag_limit: number;
  /** Пачка в `sending` дольше этого — worker упал на отправке, отправляем заново, мс. */
  stale_sending_ms: number;
  /** Сколько дней хранить журнал отправок. */
  keep_days: number;
};

/**
 * Правила очереди ревалидации витрин: срок отправки пачки (дебаунс с потолком), паузы повторов, слияние тегов.
 * Настройки — `src/container/common/cache.ts`; чистые методы — unit-тесты на таблицу случаев.
 */
export class RevalidationSchedule {
  constructor(readonly options: RevalidationScheduleOptions) {}

  /** Срок отправки: окно от последнего события, но не позже `max_wait` от первого. */
  dueAt({ now, first_queued_at }: { now: Date; first_queued_at: Date }): Date {
    return new Date(
      Math.min(now.getTime() + this.options.window_ms, first_queued_at.getTime() + this.options.max_wait_ms),
    );
  }

  /** Пауза перед повтором после `attempts` неудач подряд; `null` — повторов больше нет. */
  retryDelay(attempts: number): number | null {
    return attempts >= 1 ? (this.options.retry_delays_ms[attempts - 1] ?? null) : null;
  }

  mergeTags(current: readonly string[], incoming: readonly string[]): string[] {
    return mergeStorefrontTags(current, incoming, this.options.tag_limit);
  }

  /** Сколько ждать до срока; срок прошёл — 0. */
  delayUntil({ now, due_at }: { now: Date; due_at: Date }): number {
    return Math.max(0, due_at.getTime() - now.getTime());
  }
}
