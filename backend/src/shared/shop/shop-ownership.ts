import { isRecord, textOrNull } from "../query/narrow";

/**
 * Маршрут Admin API сущности магазина: `/admin/{resource}/:id` и всё, что под ним, доступно только из её
 * магазина (`x-shop-id`), чужая — 404. Реестр — `shopOwnedRoutes` в `src/container/common/shop.ts`.
 */
export type ShopOwnedRoute = {
  /** Путь с `:id` — проверка действует на него и на вложенные пути (`/admin/suppliers/:id/import-runs`). */
  matcher: string;
  /** Сущность в Query (`supplier`, `import_run`). */
  entity: string;
  /** Где у неё магазин: своё поле (`shop_id`) или через связь (`supplier.shop_id`). */
  shop_field: string;
  /** Для сообщения: «Не найдено в текущем магазине: поставщик sup_1». */
  label: string;
};

/** Магазин строки Query по пути поля (`supplier.shop_id`); нет связи или поля — `null`. */
export function shopIdAt(row: unknown, field: string): string | null {
  const value = field
    .split(".")
    .reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), row);
  return textOrNull(value);
}
