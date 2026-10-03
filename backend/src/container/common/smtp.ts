import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { define } from "@shared/container";
import { SMTP, type SMTPOptions } from "@shared/service/smtp/smtp";

/** Локально — Mailpit (devops/docker-compose.yml), на проде — любой SMTP из group_vars. */
export const smtpConfig: SMTPOptions = {
  host: process.env.SMTP_HOST ?? "",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  user: process.env.SMTP_USER ?? "",
  password: process.env.SMTP_PASSWORD ?? "",
  from: process.env.SMTP_FROM ?? "",
};

export default [
  define(
    SMTP,
    ({ container }) =>
      new SMTP(smtpConfig, container.resolve(ContainerRegistrationKeys.LOGGER)),
  ),
];
