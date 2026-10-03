import { randomBytes } from "node:crypto";

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

import { EXCHANGE_MODULE } from "../../../index";
import type { ExchangeModuleService } from "../../../service/exchange-module-service";
import type { StartImportRunCommand } from "../command";
import type { StartedImportRunDTO } from "../dto";

/** Папка пакета `<поставщик>/<дата-время>-<случайное>`: по ней видно, когда пришла выгрузка. Откат удаляет запуск. */
export const createImportRunStep = createStep(
  "create-import-run",
  async (command: StartImportRunCommand, { container }) => {
    const exchange = container.resolve<ExchangeModuleService>(EXCHANGE_MODULE);
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
    const dir = `${command.supplier_id}/${stamp}-${randomBytes(3).toString("hex")}`;
    const run = await exchange.createImportRuns({
      supplier_id: command.supplier_id,
      source: command.source,
      status: command.status,
      dir,
    });
    const dto: StartedImportRunDTO = { id: run.id, supplier_id: run.supplier_id, dir, status: command.status };
    return new StepResponse(dto, run.id);
  },
  async (id, { container }) => {
    if (!id) return;
    await container.resolve<ExchangeModuleService>(EXCHANGE_MODULE).deleteImportRuns(id);
  },
);
