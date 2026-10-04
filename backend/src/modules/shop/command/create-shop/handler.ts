import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { CreateShopCommand } from "./command";
import type { CreatedShopDTO } from "./dto";
import { createShopWorkflow } from "./workflow";

/** Создаёт магазин сети — из админки (`POST /admin/shops`) и сида (`initial-data-seed`). */
@Injectable()
export class CreateShopHandler extends AbstractCommandHandler<
  CreateShopCommand,
  CreatedShopDTO
> {
  protected readonly workflow = createShopWorkflow;
}
