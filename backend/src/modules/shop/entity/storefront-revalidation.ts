import type { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";

/** `pending` — копит теги и ждёт `due_at`, `sending` — вебхук в пути, `sent` / `failed` — итог (журнал). */
export const STOREFRONT_REVALIDATION_STATUSES = ["pending", "sending", "sent", "failed"] as const;
export type StorefrontRevalidationStatus = (typeof STOREFRONT_REVALIDATION_STATUSES)[number];

/**
 * Пачка тегов для вебхука ревалидации витрины магазина и запись журнала отправок. События за окно дебаунса
 * сливаются в одну пачку на магазин (`queue-storefront-revalidations`), отправку и повторы ведёт
 * `send-storefront-revalidation`.
 */
export const StorefrontRevalidation = model
  .define("storefront_revalidation", {
    id: model.id({ prefix: "srev" }).primaryKey(),
    shop_id: model.text(),
    tags: model.array(),
    status: model.enum([...STOREFRONT_REVALIDATION_STATUSES]).default("pending"),
    /** Неудачных отправок подряд — от него пауза до повтора. */
    attempts: model.number().default(0),
    /** Первое событие пачки: дебаунс не откладывает отправку дольше `max_wait` от него. */
    first_queued_at: model.dateTime(),
    /** Когда отправлять: каждое новое событие сдвигает срок на окно дебаунса. */
    due_at: model.dateTime(),
    sent_at: model.dateTime().nullable(),
    /** HTTP-код последнего ответа витрины. */
    response_status: model.number().nullable(),
    error: model.text().nullable(),
  })
  .indexes([
    { on: ["shop_id", "status"] },
    { on: ["status", "due_at"] },
    { on: ["shop_id", "created_at"] },
  ]);

/** Строка таблицы — только внутри модуля, наружу отдаём DTO. */
export type StorefrontRevalidationEntity = InferTypeOf<typeof StorefrontRevalidation>;
