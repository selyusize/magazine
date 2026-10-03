import { defineLink } from "@medusajs/framework/utils";

import ExchangeModule from "../modules/exchange";
import SupplierModule from "../modules/supplier";

/** Поставщик запуска импорта (read-only по `supplier_id`): Query отдаёт `import_run.supplier` — история в админке. */
export default defineLink(
  { linkable: ExchangeModule.linkable.importRun, field: "supplier_id" },
  SupplierModule.linkable.supplier,
  { readOnly: true },
);
