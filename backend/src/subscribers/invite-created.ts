import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { sendEmail, shopUrls } from "../lib/email";

/** Приглашение сотрудника в админку (создание и повторная отправка). */
export default async function inviteEmail({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [invite],
  } = await query.graph({ entity: "invite", fields: ["email", "token"], filters: { id: data.id } });
  if (!invite) return;

  await sendEmail(container, {
    to: invite.email,
    template: "user-invite",
    data: { url: `${shopUrls.admin}/app/invite?token=${encodeURIComponent(invite.token)}` },
  });
}

export const config: SubscriberConfig = { event: ["invite.created", "invite.resent"] };
