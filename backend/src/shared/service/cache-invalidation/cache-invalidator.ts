import type { ICachingModuleService, Logger } from "@medusajs/framework/types";

import { isRecord, isString } from "../../query/narrow";

/** Данные события сущности: Medusa и наши workflows шлют `{ id }` или массив таких объектов. */
export type CacheEventData = unknown;

/** Строка Query сущности события. */
export type CacheEntityRow = Record<string, unknown>;

/**
 * Витрины, которым событие делает кэш устаревшим:
 * - `entity` — `id` из события → строка Query → её магазин и теги. Строки нет (сущность удалена) или магазин не
 *   определился — `orphan_tags` уходят всем магазинам: лучше лишний сброс, чем устаревшая витрина;
 * - `shop` — магазин прямо в данных события (`field`: `id` у событий магазина, `shop_id` у редиректов);
 * - `network` — сетевая сущность: всем активным магазинам.
 */
export type StorefrontTarget =
  | {
      scope: "entity";
      /** Сущность в Query, `id` которой приходит в событии. */
      entity: string;
      fields: string[];
      shopOf: (row: CacheEntityRow) => string | null;
      tags: (row: CacheEntityRow) => string[];
      orphan_tags: string[];
    }
  | { scope: "shop"; field: string; tags: string[] }
  | { scope: "network"; tags: string[] };

/**
 * Правило реестра: событие → (а) теги кэша бэкенда, (б) теги витрин и их магазины. Реестр —
 * `src/container/common/cache.ts`, одна строка на событие или группу событий сущности.
 */
export type CacheInvalidationRule = {
  event: string;
  /** Теги `AbstractFetcher.cached(..., tags)`. */
  backend?: (data: CacheEventData) => string[];
  storefront?: StorefrontTarget;
};

/** Теги кэша бэкенда всех правил события без повторов. */
export const tagsForEvent = (
  rules: CacheInvalidationRule[],
  event: string,
  data: CacheEventData,
): string[] => [
  ...new Set(
    rules
      .filter((rule) => rule.event === event)
      .flatMap((rule) => rule.backend?.(data) ?? []),
  ),
];

/** Цели витрин всех правил события. */
export const storefrontTargetsForEvent = (rules: CacheInvalidationRule[], event: string): StorefrontTarget[] =>
  rules.flatMap((rule) => (rule.event === event && rule.storefront ? [rule.storefront] : []));

/** Значения поля из данных события: `{ id }`, `[{ id }, …]`; без поля — пусто. */
export function eventValues(data: CacheEventData, field: string): string[] {
  const items = Array.isArray(data) ? data : [data];
  return [
    ...new Set(
      items.flatMap((item) => {
        const value = isRecord(item) ? item[field] : undefined;
        return isString(value) && value ? [value] : [];
      }),
    ),
  ];
}

/** Одно правило на несколько событий сущности: `on(["brand.created", "brand.updated"], { storefront })`. */
export const on = (
  events: string[],
  rule: Omit<CacheInvalidationRule, "event">,
): CacheInvalidationRule[] => events.map((event) => ({ ...rule, event }));

/** Реестр инвалидации для контейнера: правила из `src/container/common/cache.ts`. */
export class CacheInvalidationRegistry {
  constructor(readonly rules: CacheInvalidationRule[]) {}

  /** События реестра — на них подписан `src/subscribers/cache-invalidation.ts`. */
  get events(): string[] {
    return [...new Set(this.rules.map((rule) => rule.event))];
  }

  backendTags(event: string, data: CacheEventData): string[] {
    return tagsForEvent(this.rules, event, data);
  }

  storefrontTargets(event: string): StorefrontTarget[] {
    return storefrontTargetsForEvent(this.rules, event);
  }
}

/**
 * Сброс кэша бэкенда по событию изменения (`AbstractFetcher.cached(..., tags)`). Без Redis модуля кэша нет —
 * сбрасывать нечего. Витрины сбрасывает `invalidate-caches-by-event` модуля `shop`.
 */
export class CacheInvalidator {
  constructor(
    private readonly registry: CacheInvalidationRegistry,
    private readonly cache: Pick<ICachingModuleService, "clear"> | undefined,
    private readonly logger: Pick<Logger, "debug">,
  ) {}

  async invalidate(event: string, data: CacheEventData): Promise<string[]> {
    const tags = this.registry.backendTags(event, data);
    if (!this.cache || tags.length === 0) return tags;

    await this.cache.clear({ tags });
    this.logger.debug(`cache-invalidation: ${event} → ${tags.join(", ")}`);
    return tags;
  }
}
