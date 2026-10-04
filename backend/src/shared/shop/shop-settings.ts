import { z } from "@medusajs/framework/zod";

const text = (max: number) => z.string().trim().min(1).max(max).optional();

/**
 * Настройки магазина (`shop.settings`, JSON). Все поля необязательны: магазин создаётся с пустыми настройками и
 * заполняется в админке. Новые группы (письма, доставка, SEO по умолчанию, ЮKassa) добавляются сюда в своих шагах
 * плана — форма админки и проверка тела запроса берут ту же схему.
 */
export const ShopSettingsSchema = z.object({
  /** Контакты магазина для подвала витрины и писем. */
  contacts: z
    .object({
      phone: text(50),
      email: z.email().max(200).optional(),
      address: text(500),
    })
    .optional(),
  /** Логотип — для писем и разметки Organization. */
  logo_url: z.url().max(2000).optional(),
});

export type ShopSettings = z.infer<typeof ShopSettingsSchema>;

/** Настройки из JSON-поля БД; не подходят под схему (старая запись, ручная правка) — пустые, а не ошибка ответа. */
export function parseShopSettings(value: unknown): ShopSettings {
  const parsed = ShopSettingsSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}
