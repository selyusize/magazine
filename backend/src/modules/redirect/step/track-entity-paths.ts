import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { REDIRECT_MODULE } from "../index";
import type {
  EntityPathInput,
  EntityPathMove,
  RedirectModuleService,
} from "../service/redirect-module-service";

/** Переезды путей и магазины, в которых с живых путей сняты правила (таблица редиректов изменилась). */
export type TrackedEntityPaths = {
  moves: EntityPathMove[];
  released_shop_ids: string[];
};

/** Общий шаг команд модуля: запоминает пути сущностей и отдаёт переезды (старый → новый путь). */
export const trackEntityPathsStep = createStep(
  "track-entity-paths",
  async (inputs: EntityPathInput[], { container }) => {
    const { moves, changes } = await container
      .resolve<RedirectModuleService>(REDIRECT_MODULE)
      .trackEntityPaths(inputs);
    const released_shop_ids = [...new Set(changes.redirects.deleted.map((redirect) => redirect.shop_id))];
    return new StepResponse<TrackedEntityPaths, typeof changes>({ moves, released_shop_ids }, changes);
  },
  async (changes, { container }) => {
    if (!changes) return;
    await container
      .resolve<RedirectModuleService>(REDIRECT_MODULE)
      .revertTrackedPaths(changes);
  },
);
