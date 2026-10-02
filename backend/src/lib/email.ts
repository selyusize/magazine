import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

import type { EmailTemplate } from "../modules/smtp/templates";

/** Публичные адреса для ссылок в письмах. */
export const shopUrls = {
  storefront: (process.env.STOREFRONT_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  admin: (process.env.MEDUSA_ADMIN_URL ?? "http://localhost:9000").replace(/\/$/, ""),
};

/** Письмо через модуль Notification (SMTP или, без SMTP_HOST, вывод в лог). */
export async function sendEmail(
  container: MedusaContainer,
  email: { to: string; template: EmailTemplate; data: Record<string, unknown> },
) {
  const notification = container.resolve(Modules.NOTIFICATION);
  await notification.createNotifications({ ...email, channel: "email" });
}
