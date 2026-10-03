import type { MedusaContainer } from "@medusajs/framework/types";

import { Container } from "@container/index";
import { ResumeStalledImportRunsHandler } from "@domain/exchange/command/resume-stalled-import-runs/handler";

/** Зависшие запуски импорта (упал worker, потерялось событие) — снова в очередь, с места остановки. */
export default async function exchangeResumeImportRuns(container: MedusaContainer) {
  await Container.from(container).get(ResumeStalledImportRunsHandler).handle({ now: new Date().toISOString() });
}

export const config = { name: "exchange-resume-import-runs", schedule: "*/5 * * * *" };
