/** Что попап помнит о посетителе. Хранится в localStorage по имени кампании. */
type PromoPopupState = { shownAt?: number; subscribed?: boolean };

const DAY = 24 * 60 * 60 * 1000;
const key = (id: string) => `promo-popup:${id}`;

// localStorage недоступен в приватном режиме / при запрете cookies — тогда попап просто показывается
function read(id: string): PromoPopupState {
  try {
    return JSON.parse(window.localStorage.getItem(key(id)) ?? "{}") as PromoPopupState;
  } catch {
    return {};
  }
}

function write(id: string, patch: PromoPopupState) {
  try {
    window.localStorage.setItem(key(id), JSON.stringify({ ...read(id), ...patch }));
  } catch {
    // Не запомнили — покажем ещё раз, это не ошибка
  }
}

/** Подписавшимся — никогда, остальным — не чаще раза в dismissDays. */
export function canShowPromo(id: string, dismissDays: number, now = Date.now()) {
  const { shownAt, subscribed } = read(id);
  if (subscribed) return false;
  return shownAt === undefined || now - shownAt >= dismissDays * DAY;
}

export const markPromoShown = (id: string) => write(id, { shownAt: Date.now() });
export const markPromoSubscribed = (id: string) => write(id, { subscribed: true });
