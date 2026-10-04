/** Ключ выбранного магазина в localStorage: выбор переживает перезагрузку и общий для всех страниц админки. */
const STORAGE_KEY = "snowaa.admin.shop_id";

/** Заголовок текущего магазина в Admin API (`src/shared/shop/shop-context.ts` на бэкенде). */
export const ADMIN_SHOP_HEADER = "x-shop-id";

/** Выбранный магазин; хранилище недоступно (приватное окно) — `null`, роуты без магазина работают. */
export function readCurrentShopId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeCurrentShopId(shopId: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, shopId);
  } catch {
    // Без хранилища выбор живёт до перезагрузки — в состоянии переключателя
  }
}
