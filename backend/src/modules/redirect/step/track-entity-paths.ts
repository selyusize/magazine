import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { REDIRECT_MODULE } from "../index";
import type {
  EntityPathInput,
  EntityPathMove,
  RedirectModuleService,
} from "../service/redirect-module-service";

/** Общий шаг команд модуля: запоминает пути сущностей и отдаёт переезды (старый → новый путь). */
export const trackEntityPathsStep = createStep(
  "track-entity-paths",
  async (inputs: EntityPathInput[], { container }) => {
    const { moves, changes } = await container
      .resolve<RedirectModuleService>(REDIRECT_MODULE)
      .trackEntityPaths(inputs);
    return new StepResponse<EntityPathMove[], typeof changes>(moves, changes);
  },
  async (changes, { container }) => {
    if (!changes) return;
    await container
      .resolve<RedirectModuleService>(REDIRECT_MODULE)
      .revertTrackedPaths(changes);
  },
);
