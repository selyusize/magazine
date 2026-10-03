import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import type { Command } from "@shared/contract/command";

import { supplierOfferCRUD } from "../../crud/supplier-offer";
import type { CreateSupplierOfferCommand } from "./command";
import type { CreatedSupplierOfferDTO } from "./dto";
import { validateSupplierOfferStep } from "./step/validate-supplier-offer";

/** Проверка + создание workflow фабрики: событие `supplier_offer.created` пересчитает остатки варианта. */
export const createSupplierOfferWorkflow = createWorkflow(
  "create-supplier-offer",
  (command: CreateSupplierOfferCommand) => {
    const data = validateSupplierOfferStep(command);
    const offer = supplierOfferCRUD.workflows.create.runAsStep({
      input: transform(data, (data): Command => data),
    });
    return new WorkflowResponse<CreatedSupplierOfferDTO>(offer);
  },
);
