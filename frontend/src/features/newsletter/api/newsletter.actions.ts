"use server";

import { runAction, type ActionResult } from "@shared/lib/action-result";

import { newsletterSchema, type NewsletterInput } from "../model/schemas";

/**
 * Подписка на рассылку. Пока мок: в Medusa нет модуля рассылок.
 * Подключение — здесь: свой роут Medusa (/store/newsletter), Unisender, Mindbox и т.п.
 * Форма и её логика от источника не зависят.
 */
export async function subscribe(input: NewsletterInput): Promise<ActionResult<null>> {
  return runAction(async () => {
    // Server Action — публичный эндпоинт: вход проверяется той же схемой, что и форма
    newsletterSchema.parse(input);
    return null;
  });
}
