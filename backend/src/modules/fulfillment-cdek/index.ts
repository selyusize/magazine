import { ModuleProvider, Modules } from "@medusajs/framework/utils";

import { CDEKFulfillmentService } from "./service/cdek-fulfillment";

/** Провайдер доставки СДЭК (id в Medusa — `cdek_cdek`). Подключается в medusa-config.ts. */
export default ModuleProvider(Modules.FULFILLMENT, {
  services: [CDEKFulfillmentService],
});
