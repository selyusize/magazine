import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils";
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";
import nodemailer, { type Transporter } from "nodemailer";

import { renderEmail, type EmailTemplate } from "./templates";

export type SmtpOptions = {
  host: string;
  port: number;
  /** true — TLS сразу (порт 465), false — STARTTLS (587) или без шифрования (локальный Mailpit, 1025) */
  secure: boolean;
  user?: string;
  password?: string;
  /** Отправитель по умолчанию: "Магазин <shop@example.ru>" */
  from: string;
  /** Название магазина в письмах */
  shop_name: string;
};

/**
 * Отправка писем через любой SMTP (Яндекс 360, Mail.ru, Unisender, Mailpit локально).
 * Письмо — либо готовые `content.subject/html`, либо `template` + `data` из ./templates.
 */
export default class SmtpNotificationService extends AbstractNotificationProviderService {
  static identifier = "notification-smtp";

  protected readonly options_: SmtpOptions;
  protected readonly logger_: Logger;
  protected readonly transporter_: Transporter;

  constructor({ logger }: { logger: Logger }, options: SmtpOptions) {
    super();
    this.options_ = options;
    this.logger_ = logger;
    this.transporter_ = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: options.user ? { user: options.user, pass: options.password } : undefined,
    });
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.host || !options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "SMTP: нужны host и from (SMTP_HOST, SMTP_FROM)");
    }
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const email = notification.content?.html
      ? { subject: notification.content.subject ?? "", html: notification.content.html, text: notification.content.text }
      : renderEmail(notification.template as EmailTemplate, notification.data ?? {}, this.options_.shop_name);

    try {
      const info = await this.transporter_.sendMail({
        from: notification.from?.trim() || this.options_.from,
        to: notification.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: notification.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          encoding: "base64",
          contentType: attachment.content_type,
          cid: attachment.id,
        })),
      });
      return { id: info.messageId };
    } catch (error) {
      this.logger_.error(`SMTP: не удалось отправить «${email.subject}» на ${notification.to}: ${(error as Error).message}`);
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Не удалось отправить письмо: ${(error as Error).message}`);
    }
  }
}
