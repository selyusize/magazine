import { MedusaError } from "@medusajs/framework/utils";

/**
 * Шаблоны писем. Добавить письмо: новый ключ в `templates` + подписчик в src/subscribers,
 * который вызывает sendEmail(container, { to, template, data }).
 */
export type EmailTemplate = keyof typeof templates;

type Email = { subject: string; html: string; text: string };
type Data = Record<string, unknown>;

type OrderItem = { title: string; quantity: number; total: number };

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: currency.toUpperCase() }).format(amount);

function layout(shopName: string, title: string, body: string) {
  return `<!doctype html>
<html lang="ru">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px">
    <tr><td style="padding:32px">
      <p style="margin:0 0 24px;font-size:14px;color:#71717a">${escapeHtml(shopName)}</p>
      <h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(title)}</h1>
      ${body}
    </td></tr>
  </table>
</body>
</html>`;
}

const button = (url: string, label: string) =>
  `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;background:#18181b;color:#ffffff;border-radius:6px;text-decoration:none">${escapeHtml(label)}</a></p>
   <p style="font-size:13px;color:#71717a">Если кнопка не работает, откройте ссылку: <br>${escapeHtml(url)}</p>`;

const templates = {
  "order-placed": (data: Data, shopName: string): Email => {
    const items = (data.items as OrderItem[] | undefined) ?? [];
    const currency = String(data.currency_code ?? "rub");
    const total = formatMoney(Number(data.total ?? 0), currency);
    const shipping = formatMoney(Number(data.shipping_total ?? 0), currency);
    const subject = `Заказ №${data.display_id} оформлен`;
    const rows = items
      .map(
        (item) =>
          `<tr><td style="padding:6px 0">${escapeHtml(item.title)} × ${item.quantity}</td>` +
          `<td style="padding:6px 0;text-align:right">${formatMoney(item.total, currency)}</td></tr>`,
      )
      .join("");
    const shippingRow = `<tr><td style="padding:6px 0">Доставка</td><td style="padding:6px 0;text-align:right">${shipping}</td></tr>`;
    return {
      subject,
      html: layout(
        shopName,
        subject,
        `<p>Спасибо за заказ! Мы свяжемся с вами, когда он будет готов к отправке.</p>
         <table role="presentation" width="100%" style="border-top:1px solid #e4e4e7;margin-top:16px">${rows}${shippingRow}
           <tr><td style="padding:12px 0;border-top:1px solid #e4e4e7"><b>Итого</b></td>
               <td style="padding:12px 0;border-top:1px solid #e4e4e7;text-align:right"><b>${total}</b></td></tr>
         </table>`,
      ),
      text: [
        `${subject}. Спасибо за заказ!`,
        ...items.map((item) => `${item.title} × ${item.quantity} — ${formatMoney(item.total, currency)}`),
        `Доставка: ${shipping}`,
        `Итого: ${total}`,
      ].join("\n"),
    };
  },

  "password-reset": (data: Data, shopName: string): Email => {
    const subject = "Восстановление пароля";
    const url = String(data.url);
    return {
      subject,
      html: layout(
        shopName,
        subject,
        `<p>Мы получили запрос на смену пароля. Ссылка действует 15 минут.</p>
         ${button(url, "Задать новый пароль")}
         <p style="font-size:13px;color:#71717a">Если вы не запрашивали смену пароля, просто проигнорируйте письмо.</p>`,
      ),
      text: `${subject}. Задать новый пароль: ${url}\nЕсли вы не запрашивали смену пароля, проигнорируйте письмо.`,
    };
  },

  "user-invite": (data: Data, shopName: string): Email => {
    const subject = `Приглашение в админку ${shopName}`;
    const url = String(data.url);
    return {
      subject,
      html: layout(shopName, subject, `<p>Вас пригласили управлять магазином.</p>${button(url, "Принять приглашение")}`),
      text: `${subject}. Принять приглашение: ${url}`,
    };
  },

  "customer-welcome": (data: Data, shopName: string): Email => {
    const name = data.first_name ? `, ${data.first_name}` : "";
    const subject = `Добро пожаловать в ${shopName}`;
    const url = String(data.url);
    return {
      subject,
      html: layout(
        shopName,
        `Здравствуйте${name}!`,
        `<p>Аккаунт создан. В личном кабинете — ваши заказы и адреса доставки.</p>${button(url, "Перейти в магазин")}`,
      ),
      text: `Здравствуйте${name}! Аккаунт в ${shopName} создан: ${url}`,
    };
  },
};

export function renderEmail(template: EmailTemplate, data: Data, shopName: string): Email {
  const render = templates[template];
  if (!render) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Нет шаблона письма «${template}» (src/modules/smtp/templates.ts)`);
  }
  return render(data, shopName);
}
