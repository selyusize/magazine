import { MedusaError } from "@medusajs/framework/utils";

/**
 * Магазин запроса: Store API — по publishable-ключу, Admin API — по заголовку `x-shop-id`. Кладут его
 * middleware (`src/api/middlewares/shop-context.ts`), читают Actions через `requireShop` / `requireAdminShop`.
 */
export type ShopContext = {
  id: string;
  slug: string;
  name: string;
  domain: string;
  storefront_url: string;
  is_active: boolean;
  sales_channel_id: string | null;
};

/** Заголовок текущего магазина в Admin API — его подставляет `adminFetch` из переключателя магазина. */
export const ADMIN_SHOP_HEADER = "x-shop-id";

declare global {
  namespace Express {
    interface Request {
      /** Магазин запроса; нет — middleware не нашёл (админка без заголовка). */
      shop?: ShopContext;
    }
  }
}

/** Магазин Store-запроса. Middleware уже отклонил ключ без магазина, так что отсутствие — ошибка маршрута. */
export function requireShop(req: { shop?: ShopContext }): ShopContext {
  if (req.shop) return req.shop;
  throw new MedusaError(
    MedusaError.Types.FORBIDDEN,
    "Ключ витрины не привязан к магазину",
  );
}

/** Магазин Admin-запроса для «магазинных» роутов: без заголовка `x-shop-id` — 400. */
export function requireAdminShop(req: { shop?: ShopContext }): ShopContext {
  if (req.shop) return req.shop;
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `Выберите магазин: заголовок ${ADMIN_SHOP_HEADER} обязателен для этого раздела`,
  );
}
