import { AbstractCommandHandler } from "@shared/command/abstract-command-handler";
import { Injectable } from "@shared/container";

import type { CreateSupplierOfferCommand } from "./command";
import type { CreatedSupplierOfferDTO } from "./dto";
import { createSupplierOfferWorkflow } from "./workflow";

/** Создаёт предложение поставщика по варианту. */
@Injectable()
export class CreateSupplierOfferHandler extends AbstractCommandHandler<
  CreateSupplierOfferCommand,
  CreatedSupplierOfferDTO
> {
  protected readonly workflow = createSupplierOfferWorkflow;
}
