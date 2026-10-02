import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { sendEmail } from "../lib/email";

/** Письмо покупателю: заказ оформлен. */
export default async function orderPlacedEmail({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["display_id", "email", "currency_code", "total", "shipping_total", "items.title", "items.quantity", "items.total"],
    filters: { id: data.id },
  });
  if (!order?.email) return;

  await sendEmail(container, {
    to: order.email,
    template: "order-placed",
    data: {
      display_id: order.display_id,
      currency_code: order.currency_code,
      total: Number(order.total),
      shipping_total: Number(order.shipping_total ?? 0),
      items: (order.items ?? []).map((item) => ({
        title: item?.title,
        quantity: Number(item?.quantity),
        total: Number(item?.total),
      })),
    },
  });
}

export const config: SubscriberConfig = { event: "order.placed" };
