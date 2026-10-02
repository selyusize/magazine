import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import { sendEmail, shopUrls } from "../lib/email";

type PasswordReset = { entity_id: string; actor_type: string; token: string };

/**
 * Ссылка на смену пароля (POST /auth/{customer|user}/emailpass/reset-password).
 * Покупатель — страница витрины /reset-password, админ — страница админки Medusa.
 */
export default async function passwordResetEmail({ event: { data }, container }: SubscriberArgs<PasswordReset>) {
  const params = new URLSearchParams({ token: data.token, email: data.entity_id });
  const url =
    data.actor_type === "user"
      ? `${shopUrls.admin}/app/reset-password?${params}`
      : `${shopUrls.storefront}/reset-password?${params}`;

  await sendEmail(container, { to: data.entity_id, template: "password-reset", data: { url } });
}

export const config: SubscriberConfig = { event: "auth.password_reset" };
