import { acquireLockStep, emitEventStep, releaseLockStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { REDIRECT_UPDATED, toRedirectEventData } from "../../service/redirect-events";
import { findEntityPathsStep } from "../../step/find-entity-paths";
import { saveRedirectsStep } from "../../step/save-redirects";
import { trackEntityPathsStep } from "../../step/track-entity-paths";
import type { SyncFilterPagePathsByCategoryIdCommand } from "./command";

/**
 * Пути посадочных зависят от handle категории. Запоминаем текущие и ставим 301 с прежних — пачкой.
 * Handle категории не менялся — пути те же, ничего не происходит. Блокировка — как у `sync-entity-url` посадочных.
 */
export const syncFilterPagePathsByCategoryIdWorkflow = createWorkflow(
  "sync-filter-page-paths-by-category-id",
  (command: SyncFilterPagePathsByCategoryIdCommand) => {
    const lockKey = "sync-entity-url:filter_page";
    acquireLockStep({ key: lockKey, timeout: 30, ttl: 60 });

    const paths = findEntityPathsStep(
      transform(command, (command) => ({
        entity_type: "filter_page" as const,
        filters: { category_id: command.category_id },
      })),
    );
    const tracked = trackEntityPathsStep(paths);
    saveRedirectsStep(
      transform(tracked, ({ moves }) =>
        moves.map((move) => ({ ...move, code: 301 as const })),
      ),
    );
    emitEventStep({
      eventName: REDIRECT_UPDATED,
      data: transform(tracked, ({ moves, released_shop_ids }) =>
        toRedirectEventData([...moves.map((move) => move.shop_id), ...released_shop_ids]),
      ),
    });

    releaseLockStep({ key: lockKey });
    return new WorkflowResponse(undefined);
  },
);
