import { acquireLockStep, emitEventStep, releaseLockStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { REDIRECT_UPDATED, toRedirectEventData } from "../../service/redirect-events";
import { buildEntityHandleStep } from "../../step/build-entity-handle";
import { saveRedirectsStep } from "../../step/save-redirects";
import type { CloseEntityURLCommand } from "./command";
import { removeEntityPathStep } from "./step/remove-entity-path";

/**
 * Сущность удалена → её путь отдаёт 410 в её магазине, а 301 со старых handle `saveRedirects` переводит туда же: цепочек на
 * мёртвую страницу нет. Если сущность на месте (событие пришло повторно после восстановления) — ничего не делаем.
 *
 * Блокировка — та же, что у `sync-entity-url`: новая сущность может прямо сейчас занимать освободившийся handle.
 */
export const closeEntityURLWorkflow = createWorkflow(
  "close-entity-url",
  (command: CloseEntityURLCommand) => {
    const lockKey = transform(
      command,
      (command) => `sync-entity-url:${command.entity_type}`,
    );
    acquireLockStep({ key: lockKey, timeout: 30, ttl: 60 });

    const entity = buildEntityHandleStep(command);

    const removed = when(
      "forget-deleted-entity-path",
      entity,
      (entity) => !entity.found,
    ).then(() => removeEntityPathStep(command));

    when("close-deleted-entity-path", { removed }, ({ removed }) =>
      Boolean(removed?.path),
    ).then(() => {
      saveRedirectsStep(
        transform({ removed, command }, ({ removed, command }) => [
          {
            shop_id: removed!.shop_id!,
            from_path: removed!.path!,
            to_path: null,
            code: 410 as const,
            entity_type: command.entity_type,
            entity_id: command.entity_id,
          },
        ]),
      );
      emitEventStep({
        eventName: REDIRECT_UPDATED,
        data: transform({ removed }, ({ removed }) => toRedirectEventData([removed?.shop_id])),
      });
    });

    releaseLockStep({ key: lockKey });
    return new WorkflowResponse(undefined);
  },
);
