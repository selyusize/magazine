import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SLUG_PATTERN, toSlug, toUniqueSlug } from "@shared/service/slug/slug";
import { splitStoredHandle, toStoredHandle } from "@shared/shop/shop-handle";

import { toURLEntityRows, URL_ENTITIES, type URLEntityType } from "../service/path";
import { findEntityShop } from "./find-entity-shop";

export type EntityHandle = {
  /** Сущность уже удалена — синхронизировать нечего. */
  found: boolean;
  handle: string;
  /**
   * Handle Medusa не `{магазин}ː{slug}` (кириллица, заглавные, нет префикса магазина) — на что заменить;
   * `null` — менять не нужно.
   */
  next_handle: string | null;
  /** Текущий путь на витрине; `null` — страницы нет или магазин сущности неизвестен. */
  path: string | null;
  /** Магазин сущности — в его таблицу редиректов пишутся 301; `null` — магазина нет, путь не отслеживаем. */
  shop_id: string | null;
};

const NOT_FOUND: EntityHandle = { found: false, handle: "", next_handle: null, path: null, shop_id: null };

/**
 * Общий шаг команд модуля, только чтение: текущий handle, путь и магазин сущности, а если handle от Medusa не
 * `{магазин}ː{slug}` — свободный вариант с префиксом магазина (свободный в магазине: handle других магазинов
 * отличаются префиксом). У сущности без магазина исправляется только slug. `found: false` — сущности нет (удалена).
 */
export const buildEntityHandleStep = createStep(
  "build-entity-handle",
  async (command: { entity_type: URLEntityType; entity_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const config = URL_ENTITIES[command.entity_type];

    const { data } = await query.graph({
      entity: config.entity,
      fields: config.fields,
      filters: { id: command.entity_id },
    });
    const [row] = toURLEntityRows(data);
    if (!row) return new StepResponse<EntityHandle>(NOT_FOUND);

    const handle = String(row.handle ?? "");
    const shop = await findEntityShop(query, config.shopOf(row));
    const current = { found: true, handle, shop_id: shop?.id ?? null };
    const stored = splitStoredHandle(handle);
    // Магазин неизвестен (коллекция до выбора магазина, корень до связи) — префикс, какой есть, не трогаем
    const prefix = shop?.slug ?? stored.shop;
    const withShop = (slug: string): string => (prefix ? toStoredHandle({ shop: prefix, handle: slug }) : slug);

    if (!config.renamable || (SLUG_PATTERN.test(stored.handle) && stored.shop === prefix))
      return new StepResponse<EntityHandle>({
        ...current,
        next_handle: null,
        path: shop ? config.toPath(row) : null,
      });

    const base =
      toSlug(stored.handle) ||
      toSlug(String(row[config.title] ?? "")) ||
      `${config.prefix}-${command.entity_id.slice(-6).toLowerCase()}`;
    const nextSlug = await toUniqueSlug(base, async (candidate) => {
      const { data: taken } = await query.graph({
        entity: config.entity,
        fields: ["id"],
        filters: { handle: withShop(candidate) },
      });
      return taken.some((item) => item.id !== command.entity_id);
    });

    return new StepResponse<EntityHandle>({ ...current, next_handle: withShop(nextSlug), path: null });
  },
);
