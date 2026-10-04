import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  emitEventStep,
  releaseLockStep,
} from "@medusajs/medusa/core-flows";

import type { UpdateNetworkSettingsCommand } from "./command";
import { saveNetworkSettingsStep } from "./step/save-network-settings";

/** Две первые записи одновременно создали бы две строки реквизитов. */
const LOCK_KEY = "network-settings";

/** Реквизиты сети: сохранение одной строки + событие `network_settings.updated` (кэш витрин всех магазинов — шаг 7). */
export const updateNetworkSettingsWorkflow = createWorkflow(
  "update-network-settings",
  (command: UpdateNetworkSettingsCommand) => {
    acquireLockStep({ key: LOCK_KEY, timeout: 30, ttl: 60 });
    const settings = saveNetworkSettingsStep(command);
    emitEventStep({ eventName: "network_settings.updated", data: {} });
    releaseLockStep({ key: LOCK_KEY });
    return new WorkflowResponse(settings);
  },
);
