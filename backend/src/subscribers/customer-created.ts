import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { sendEmail, shopUrls } from "../lib/email";

/** Приветствие после регистрации. Гостевые покупатели (заказ без аккаунта) письма не получают. */
export default async function customerWelcomeEmail({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["email", "first_name", "has_account"],
    filters: { id: data.id },
  });
  if (!customer?.has_account || !customer.email) return;

  await sendEmail(container, {
    to: customer.email,
    template: "customer-welcome",
    data: { first_name: customer.first_name, url: shopUrls.storefront },
  });
}

export const config: SubscriberConfig = { event: "customer.created" };
