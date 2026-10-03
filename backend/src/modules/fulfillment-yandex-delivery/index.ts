import { ModuleProvider, Modules } from "@medusajs/framework/utils";

import { YandexDeliveryFulfillmentService } from "./service/yandex-delivery-fulfillment";

/** Провайдер Яндекс Доставки (id в Medusa — `yandex-delivery_yandex-delivery`). Подключается в medusa-config.ts. */
export default ModuleProvider(Modules.FULFILLMENT, {
  services: [YandexDeliveryFulfillmentService],
});
