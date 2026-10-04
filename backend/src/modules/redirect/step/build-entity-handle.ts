import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SLUG_PATTERN, toSlug, toUniqueSlug } from "@shared/service/slug/slug";
import { splitStoredHandle, toStoredHandle } from "@shared/shop/shop-slug";

import {
  toURLEntityRows,
  URL_ENTITIES,
  type URLEntityType,
} from "../service/path";

export type EntityHandle = {
  /** Сущность уже удалена — синхронизировать нечего. */
  found: boolean;
  handle: string;
  /** Handle не slug (кириллица, заглавные) — на что заменить; `null` — менять не нужно. */
  next_handle: string | null;
  /** Текущий путь на витрине; `null` — страницы нет. */
  path: string | null;
};

/**
 * Общий шаг команд модуля, только чтение: текущий handle и путь, а если handle от Medusa не slug — свободный
 * транслитерированный вариант. `found: false` — сущности нет (удалена).
 */
export const buildEntityHandleStep = createStep(
  "build-entity-handle",
  async (
    command: { entity_type: URLEntityType; entity_id: string },
    { container },
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const config = URL_ENTITIES[command.entity_type];

    const { data } = await query.graph({
      entity: config.entity,
      fields: config.fields,
      filters: { id: command.entity_id },
    });
    const [row] = toURLEntityRows(data);
    if (!row)
      return new StepResponse<EntityHandle>({
        found: false,
        handle: "",
        next_handle: null,
        path: null,
      });

    const handle = String(row.handle ?? "");
    // Префикс магазина (`olisa--`) не трогаем: slug — только часть после него, иначе `--` схлопнется в `-`
    const stored = splitStoredHandle(handle);
    const withShop = (slug: string): string =>
      stored.shop ? toStoredHandle({ shop: stored.shop, handle: slug }) : slug;
    if (!config.renamable || SLUG_PATTERN.test(stored.handle))
      return new StepResponse<EntityHandle>({
        found: true,
        handle,
        next_handle: null,
        path: config.toPath(row),
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

    return new StepResponse<EntityHandle>({
      found: true,
      handle,
      next_handle: withShop(nextSlug),
      path: null,
    });
  },
);
