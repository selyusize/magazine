import { splitStoredHandle } from "./shop-handle";

/**
 * Ссылка на магазин, когда известна только одна его сторона: id (своё поле, связь, `additional_data`) или slug
 * (префикс handle `{slug}ː…`). Полный магазин дочитывает шаг или фетчер.
 */
export type ShopRef = { id: string } | { slug: string };

/** Магазин по префиксу handle сущности Medusa: `olisaːleto` → `{ slug: "olisa" }`; без префикса — `null`. */
export function shopRefOfHandle(handle: string): ShopRef | null {
  const slug = splitStoredHandle(handle).shop;
  return slug ? { slug } : null;
}
