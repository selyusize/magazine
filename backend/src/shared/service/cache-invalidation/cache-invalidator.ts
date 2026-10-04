import type { ICachingModuleService, Logger } from "@medusajs/framework/types";

/** Данные события сущности: Medusa и наши workflows шлют `{ id }` или массив таких объектов. */
export type CacheEventData = unknown;

/**
 * Правило реестра: событие → теги кэша бэкенда, которые оно делает устаревшими. Реестр —
 * `src/container/common/cache.ts`, одна строка на событие. Шаг 7 плана добавит теги витрины и магазин(ы).
 */
export type CacheInvalidationRule = {
  event: string;
  tags: (data: CacheEventData) => string[];
};

/** Теги всех правил события без повторов. */
export const tagsForEvent = (
  rules: CacheInvalidationRule[],
  event: string,
  data: CacheEventData,
): string[] => [
  ...new Set(
    rules
      .filter((rule) => rule.event === event)
      .flatMap((rule) => rule.tags(data)),
  ),
];

/**
 * Сброс кэша бэкенда по событию изменения (`AbstractFetcher.cached(..., tags)`). Без Redis модуля кэша нет —
 * сбрасывать нечего. Вызывается подписчиком `src/subscribers/cache-invalidation.ts`.
 */
export class CacheInvalidator {
  constructor(
    private readonly rules: CacheInvalidationRule[],
    private readonly cache: Pick<ICachingModuleService, "clear"> | undefined,
    private readonly logger: Pick<Logger, "debug">,
  ) {}

  /** События реестра — на них подписывается подписчик. */
  get events(): string[] {
    return [...new Set(this.rules.map((rule) => rule.event))];
  }

  async invalidate(event: string, data: CacheEventData): Promise<string[]> {
    const tags = tagsForEvent(this.rules, event, data);
    if (!this.cache || tags.length === 0) return tags;

    await this.cache.clear({ tags });
    this.logger.debug(`cache-invalidation: ${event} → ${tags.join(", ")}`);
    return tags;
  }
}
