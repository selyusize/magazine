import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { RegenerateRevalidateSecretForShopCommand } from "./command";
import type { RegeneratedRevalidateSecretDTO } from "./dto";
import { regenerateRevalidateSecretForShopWorkflow } from "./workflow";

/** POST /admin/shops/current/revalidate-secret — перевыпуск секрета вебхука текущего магазина. */
@Injectable()
export class RegenerateRevalidateSecretForShopHandler extends AbstractCommandHandler<
  RegenerateRevalidateSecretForShopCommand,
  RegeneratedRevalidateSecretDTO
> {
  protected readonly workflow = regenerateRevalidateSecretForShopWorkflow;
}
