import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { SLUG_PATTERN, toSlug, toUniqueSlug } from "@shared/service/slug/slug";

import {
  URL_ENTITIES,
  type URLEntityRow,
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
    const row = data[0] as URLEntityRow | undefined;
    if (!row)
      return new StepResponse<EntityHandle>({
        found: false,
        handle: "",
        next_handle: null,
        path: null,
      });

    const handle = String(row.handle ?? "");
    if (!config.renamable || SLUG_PATTERN.test(handle))
      return new StepResponse<EntityHandle>({
        found: true,
        handle,
        next_handle: null,
        path: config.toPath(row),
      });

    const base =
      toSlug(handle) ||
      toSlug(String(row[config.title] ?? "")) ||
      `${config.prefix}-${command.entity_id.slice(-6).toLowerCase()}`;
    const nextHandle = await toUniqueSlug(base, async (candidate) => {
      const { data: taken } = await query.graph({
        entity: config.entity,
        fields: ["id"],
        filters: { handle: candidate },
      });
      return taken.some((item) => item.id !== command.entity_id);
    });

    return new StepResponse<EntityHandle>({
      found: true,
      handle,
      next_handle: nextHandle,
      path: null,
    });
  },
);
