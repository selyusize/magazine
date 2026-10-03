import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { REDIRECT_MODULE } from "../index";
import type {
  RedirectInput,
  RedirectModuleService,
  RedirectRow,
} from "../service/redirect-module-service";

/** Общий шаг команд модуля: сохраняет правила без цепочек, откат возвращает таблицу как было. */
export const saveRedirectsStep = createStep(
  "save-redirects",
  async (inputs: RedirectInput[], { container }) => {
    const redirects = container.resolve<RedirectModuleService>(REDIRECT_MODULE);
    const result = await redirects.saveRedirects(inputs);
    return new StepResponse<RedirectRow[], typeof result.changes>(
      result.redirects,
      result.changes,
    );
  },
  async (changes, { container }) => {
    if (!changes) return;
    await container
      .resolve<RedirectModuleService>(REDIRECT_MODULE)
      .revertRedirectChanges(changes);
  },
);
