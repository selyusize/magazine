import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { Logger, MedusaContainer } from "@medusajs/framework/types";

import { Injectable, InjectContainer } from "@shared/container";
import type { CommandHandler } from "@shared/contract/command-handler";

import { FindSuppliersDueForPullFetcher } from "../../query/find-suppliers-due-for-pull/fetcher";
import { PullSupplierPackageHandler } from "../pull-supplier-package/handler";
import type { PullDueSuppliersCommand } from "./command";
import { errorMessage } from "@shared/service/error/error-message";

/** По поставщику за раз: сбой одного (нет настроек, сеть) не мешает остальным. */
@Injectable()
export class PullDueSuppliersHandler implements CommandHandler<PullDueSuppliersCommand, void> {
  constructor(
    private readonly due: FindSuppliersDueForPullFetcher,
    private readonly pull: PullSupplierPackageHandler,
    @InjectContainer() private readonly container: MedusaContainer,
  ) {}

  async handle(command: PullDueSuppliersCommand): Promise<void> {
    const logger = this.container.resolve<Logger>(ContainerRegistrationKeys.LOGGER);
    for (const { supplier_id } of await this.due.fetch({ now: command.now })) {
      try {
        await this.pull.handle({ supplier_id, source: "pull" });
      } catch (error) {
        logger.error(`exchange/pull-due-suppliers: ${supplier_id}: ${errorMessage(error)}`);
      }
    }
  }
}
