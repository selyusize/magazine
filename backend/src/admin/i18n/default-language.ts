const LANGUAGE_KEY = "lng";

/**
 * Дашборд Medusa берёт язык из cookie или localStorage `lng`, а без них показывает английский.
 * Если админ язык ещё не выбирал, записываем `code` в localStorage до старта i18next —
 * выбор в профиле (Profile → Language) потом перезапишет его.
 */
export function setDefaultLanguage(code: string): void {
  const hasCookie = document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${LANGUAGE_KEY}=`));

  // localStorage бывает закрыт (приватный режим, запрет сайтовых данных) — тогда остаётся язык Medusa
  try {
    if (!hasCookie && !localStorage.getItem(LANGUAGE_KEY))
      localStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    return;
  }
}
