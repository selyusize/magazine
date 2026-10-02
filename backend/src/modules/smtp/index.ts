import { ModuleProvider, Modules } from "@medusajs/framework/utils";

import SmtpNotificationService from "./service";

/** Провайдер модуля Notification: письма через SMTP. Подключается в medusa-config.ts при заданном SMTP_HOST. */
export default ModuleProvider(Modules.NOTIFICATION, {
  services: [SmtpNotificationService],
});
