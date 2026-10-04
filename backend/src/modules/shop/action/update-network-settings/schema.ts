import { z } from "@medusajs/framework/zod";

const digits = (pattern: RegExp, message: string) =>
  z.string().trim().regex(pattern, message).nullable().optional();
const text = (max: number) =>
  z.string().trim().min(1).max(max).nullable().optional();

/** Реквизиты сети: только переданные поля, `null` — очистить. Формат ИНН/ОГРН/КПП — по длине и цифрам. */
export const UpdateNetworkSettingsSchema = z.strictObject({
  name: text(200),
  legal_name: text(500),
  inn: digits(/^\d{10}(\d{2})?$/, "ИНН — 10 цифр у юрлица или 12 у ИП"),
  ogrn: digits(/^\d{13}(\d{2})?$/, "ОГРН — 13 цифр, ОГРНИП — 15"),
  kpp: digits(/^\d{9}$/, "КПП — 9 цифр"),
  legal_address: text(1000),
  phone: text(50),
  email: z.email().max(200).nullable().optional(),
});

export type UpdateNetworkSettingsBody = z.infer<
  typeof UpdateNetworkSettingsSchema
>;
