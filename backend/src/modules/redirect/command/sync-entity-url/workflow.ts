import {
  acquireLockStep,
  releaseLockStep,
  updateCollectionsWorkflow,
  updateProductCategoriesWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { buildEntityHandleStep } from "../../step/build-entity-handle";
import { saveRedirectsStep } from "../../step/save-redirects";
import { trackEntityPathsStep } from "../../step/track-entity-paths";
import type { SyncEntityURLCommand } from "./command";

/**
 * Handle не slug → переименовываем сущность и выходим: переименование пришлёт `*.updated`, и путь
 * отследит следующий запуск. Handle — slug → запоминаем путь, снимаем с него редирект (страница живая)
 * и, если путь сменился, ставим 301 со старого.
 *
 * Всё — под блокировкой на тип сущности: иначе две новые «Шапки» одновременно сочтут `shapki` свободным,
 * и второе переименование упадёт на уникальности handle.
 */
export const syncEntityURLWorkflow = createWorkflow(
  "sync-entity-url",
  (command: SyncEntityURLCommand) => {
    const lockKey = transform(
      command,
      (command) => `sync-entity-url:${command.entity_type}`,
    );
    acquireLockStep({ key: lockKey, timeout: 30, ttl: 60 });

    const entity = buildEntityHandleStep(command);

    const rename = transform({ command, entity }, ({ command, entity }) => ({
      type: entity.next_handle === null ? null : command.entity_type,
      selector: { id: command.entity_id },
      update: { handle: entity.next_handle ?? "" },
    }));

    when("rename-product", rename, (rename) => rename.type === "product").then(
      () => {
        updateProductsWorkflow.runAsStep({
          input: transform(rename, ({ selector, update }) => ({
            selector,
            update,
          })),
        });
      },
    );
    when(
      "rename-product-category",
      rename,
      (rename) => rename.type === "product_category",
    ).then(() => {
      updateProductCategoriesWorkflow.runAsStep({
        input: transform(rename, ({ selector, update }) => ({
          selector,
          update,
        })),
      });
    });
    when(
      "rename-product-collection",
      rename,
      (rename) => rename.type === "product_collection",
    ).then(() => {
      updateCollectionsWorkflow.runAsStep({
        input: transform(rename, ({ selector, update }) => ({
          selector,
          update,
        })),
      });
    });

    const moves = when(
      "track-entity-path",
      entity,
      (entity) =>
        entity.found && entity.next_handle === null && entity.path !== null,
    ).then(() =>
      trackEntityPathsStep(
        transform({ command, entity }, ({ command, entity }) => [
          {
            entity_type: command.entity_type,
            entity_id: command.entity_id,
            path: entity.path!,
          },
        ]),
      ),
    );

    when("redirect-from-previous-path", { moves }, ({ moves }) =>
      Boolean(moves?.length),
    ).then(() => {
      saveRedirectsStep(
        transform({ moves }, ({ moves }) =>
          moves!.map((move) => ({ ...move, code: 301 as const })),
        ),
      );
    });

    releaseLockStep({ key: lockKey });
    return new WorkflowResponse(undefined);
  },
);
