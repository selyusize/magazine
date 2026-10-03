import { MedusaError } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  type WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  emitEventStep,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";

import type { Command } from "../contract/command";
import type { DTO } from "../contract/dto";
import { type CRUDDefinition, type CRUDRow, repository } from "./definition";
import { resolveHandle } from "./handle";

/** Вход изменения: id + меняемые поля. */
export type UpdateEntityCommand = { id: string } & Command;
/** Вход удаления: несколько id сразу (каскад из других модулей удаляет пачкой). */
export type DeleteEntitiesCommand = { ids: string[] };

/**
 * Workflows сущности: `create-{entity}`, `update-{entity}`, `delete-{entity}`. В каждом — шаг с откатом и событие
 * `{entity}.created|updated|deleted` (на них подписан модуль redirect: путь, 301, 410). Handle выбирается под
 * блокировкой: иначе две сущности с одинаковым названием одновременно сочтут slug свободным.
 */
export function createCRUDWorkflows<TDTO extends DTO & { id: string }>(
  definition: CRUDDefinition<TDTO>,
) {
  const { entity, label } = definition;
  const notFound = (id: string) =>
    new MedusaError(MedusaError.Types.NOT_FOUND, `Не найдено: ${label} ${id}`);
  const lockKey = `crud-handle:${entity}`;
  const events = {
    created: `${entity}.created`,
    updated: `${entity}.updated`,
    deleted: `${entity}.deleted`,
  };

  /** Только чтение: подставляет в данные handle по правилам витрины (`resolveHandle`). */
  const buildHandleStep = createStep(
    `build-${entity}-handle`,
    async (input: { data: Command; id: string | null }, { container }) => {
      const { handle } = definition;
      if (!handle) return new StepResponse<Command>(input.data);

      const rows = repository(container, definition);
      const [current] = input.id ? await rows.list({ id: input.id }) : [];
      if (input.id && !current) throw notFound(input.id);

      const scopeFields = handle.scope ?? [];
      const scope = Object.fromEntries(
        scopeFields.map((field) => [
          field,
          input.data[field] ?? current?.[field],
        ]),
      );
      const requested = input.data.handle;

      const next = await resolveHandle({
        requested: typeof requested === "string" ? requested : undefined,
        title: String(input.data[handle.from] ?? current?.[handle.from] ?? ""),
        current: current ? String(current.handle) : null,
        scope_changed: scopeFields.some(
          (field) =>
            field in input.data && input.data[field] !== current?.[field],
        ),
        fallback: `${entity.replace(/_/g, "-")}-${Date.now().toString(36)}`,
        isTaken: async (candidate) =>
          (await rows.list({ ...scope, handle: candidate })).some(
            (row) => row.id !== input.id,
          ),
      });

      const { handle: _requested, ...rest } = input.data;
      return new StepResponse<Command>(
        next === null ? rest : { ...rest, handle: next },
      );
    },
  );

  const insertStep = createStep(
    `insert-${entity}`,
    async (data: Command, { container }) => {
      const row = await repository(container, definition).create(data);
      return new StepResponse(row, row.id);
    },
    async (id, { container }) => {
      if (!id) return;
      await repository(container, definition).delete([id]);
    },
  );

  const changeStep = createStep(
    `change-${entity}`,
    async (data: UpdateEntityCommand, { container }) => {
      const rows = repository(container, definition);
      const [current] = await rows.list({ id: data.id });
      if (!current) throw notFound(data.id);

      const previous = Object.fromEntries(
        Object.keys(data).map((key) => [key, current[key]]),
      ) as CRUDRow;
      const row = await rows.update(data);
      return new StepResponse(row, previous);
    },
    async (previous, { container }) => {
      if (!previous) return;
      await repository(container, definition).update(previous);
    },
  );

  const removeStep = createStep(
    `remove-${entity}`,
    async ({ ids }: DeleteEntitiesCommand, { container }) => {
      if (ids.length === 0) return new StepResponse(ids, ids);

      const rows = repository(container, definition);
      const found = new Set(
        (await rows.list({ id: ids })).map((row) => row.id),
      );
      const missing = ids.find((id) => !found.has(id));
      if (missing) throw notFound(missing);

      await rows.softDelete(ids);
      return new StepResponse(ids, ids);
    },
    async (ids, { container }) => {
      if (!ids?.length) return;
      await repository(container, definition).restore(ids);
    },
  );

  /** Ответ — свежая строка из Query с полями описания (как у карточки), включая связи. */
  const toDTO = ({ data }: { data: unknown[] }) => definition.toDTO(data[0] as CRUDRow);
  const readStep = (id: WorkflowData<string>) =>
    useQueryGraphStep({
      entity,
      fields: definition.fields,
      filters: transform(id, (id) => ({ id })),
    });

  const create = createWorkflow(`create-${entity}`, (command: Command) => {
    acquireLockStep({ key: lockKey, timeout: 30, ttl: 60 });
    const data = buildHandleStep(
      transform(command, (command) => ({ data: command, id: null })),
    );
    const row = insertStep(data);
    emitEventStep({
      eventName: events.created,
      data: transform(row, (row) => ({ id: row.id })),
    });
    releaseLockStep({ key: lockKey });
    const saved = readStep(transform(row, (row) => row.id));
    return new WorkflowResponse(transform(saved, toDTO));
  });

  const update = createWorkflow(
    `update-${entity}`,
    (command: UpdateEntityCommand) => {
      acquireLockStep({ key: lockKey, timeout: 30, ttl: 60 });
      const data = buildHandleStep(
        transform(command, ({ id, ...data }) => ({
          data: data as Command,
          id,
        })),
      );
      const row = changeStep(
        transform(
          { command, data },
          ({ command, data }): UpdateEntityCommand => ({
            ...data,
            id: command.id,
          }),
        ),
      );
      emitEventStep({
        eventName: events.updated,
        data: transform(row, (row) => ({ id: row.id })),
      });
      releaseLockStep({ key: lockKey });
      const saved = readStep(transform(row, (row) => row.id));
      return new WorkflowResponse(transform(saved, toDTO));
    },
  );

  const remove = createWorkflow(
    `delete-${entity}`,
    (command: DeleteEntitiesCommand) => {
      const ids = removeStep(command);
      emitEventStep({
        eventName: events.deleted,
        data: transform(ids, (ids) => ids.map((id) => ({ id }))),
      });
      return new WorkflowResponse(undefined);
    },
  );

  return { create, update, delete: remove };
}
