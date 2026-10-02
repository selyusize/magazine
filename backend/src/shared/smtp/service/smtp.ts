import type { Logger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import nodemailer, { type Transporter } from "nodemailer";

export type SMTPOptions = {
  /** Пусто — письма не отправляются, а пишутся в лог (dev без Mailpit) */
  host: string;
  port: number;
  /** true — TLS сразу (порт 465), false — STARTTLS (587) или без шифрования (локальный Mailpit, 1025) */
  secure: boolean;
  user: string;
  password: string;
  /** Отправитель по умолчанию: "Магазин <shop@example.ru>" */
  from: string;
};

export type SMTPMessage = {
  to: string;
  subject: string;
  html: string;
  /** Текстовая версия для почтовиков без HTML */
  text?: string;
  /** Отправитель, если не тот, что в SMTP_FROM */
  from?: string;
};

/**
 * Отправка писем через любой SMTP (Яндекс 360, Mail.ru, Unisender, Mailpit локально).
 * Собирается в src/container/common/smtp.ts: `Container.from(container).get(SMTP)` или параметр конструктора `smtp: SMTP`.
 */
export class SMTP {
  private readonly transporter: Transporter | null;

  constructor(
    private readonly options: SMTPOptions,
    private readonly logger: Logger,
  ) {
    this.transporter = options.host
      ? nodemailer.createTransport({
          host: options.host,
          port: options.port,
          secure: options.secure,
          auth: options.user ? { user: options.user, pass: options.password } : undefined,
        })
      : null;
  }

  /** Отправляет письмо и возвращает Message-ID; без SMTP_HOST только пишет письмо в лог и возвращает null. */
  async send(message: SMTPMessage): Promise<string | null> {
    if (!this.transporter) {
      this.logger.info(`smtp/send: SMTP_HOST не задан, письмо «${message.subject}» для ${message.to} не отправлено`);
      return null;
    }

    const from = message.from?.trim() || this.options.from;
    if (!from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "SMTP: не задан отправитель (SMTP_FROM)");
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return info.messageId;
    } catch (error) {
      this.logger.error(`smtp/send: не удалось отправить «${message.subject}» на ${message.to}: ${(error as Error).message}`);
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Не удалось отправить письмо: ${(error as Error).message}`);
    }
  }
}
