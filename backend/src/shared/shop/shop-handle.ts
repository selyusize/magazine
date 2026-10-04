import { isRecord } from "../query/narrow";
import { ShopSlugSchema } from "./shop-slug";

/**
 * Разделитель префикса магазина в handle сущностей Medusa: `olisaːutyug-philips` (U+02D0, «ː» — буква-модификатор).
 * Handle товара, категории и коллекции в Medusa уникален на всю сеть, поэтому хранится с префиксом магазина.
 *
 * Не `--`: модуль товаров Medusa проверяет handle (`isValidHandle`) и двойной дефис отклоняет, а буквы любого
 * алфавита пропускает. В slug (`SLUG_PATTERN`, только `[a-z0-9-]`) этого символа не бывает, поэтому префикс
 * отделяется однозначно, а наружу (Store API, пути, редиректы) handle уходит без него.
 */
export const SHOP_HANDLE_SEPARATOR = "ː";

/** Handle сущности Medusa в БД: `{ shop: "olisa", handle: "utyug-philips" }` → `olisaːutyug-philips`. */
export const toStoredHandle = ({ shop, handle }: { shop: string; handle: string }): string =>
  `${shop}${SHOP_HANDLE_SEPARATOR}${handle}`;

/**
 * Handle из БД → магазин и handle витрины: `olisaːutyug-philips` → `{ shop: "olisa", handle: "utyug-philips" }`.
 * Без префикса (handle от Medusa до синхронизации адреса, ручной ввод) — `shop: null` и handle целиком.
 */
export function splitStoredHandle(stored: string): { shop: string | null; handle: string } {
  const index = stored.indexOf(SHOP_HANDLE_SEPARATOR);
  const shop = index > 0 ? stored.slice(0, index) : "";
  if (!ShopSlugSchema.safeParse(shop).success || shop !== shop.trim()) return { shop: null, handle: stored };
  return { shop, handle: stored.slice(index + SHOP_HANDLE_SEPARATOR.length) };
}

/** Handle витрины: без префикса магазина (`olisaːutyug-philips` → `utyug-philips`). */
export const toPublicHandle = (stored: string): string => splitStoredHandle(stored).handle;

/**
 * Handle витрины → handle в БД для магазина `shop`. Уже с префиксом этого магазина — как есть (повторная обработка
 * безопасна); с префиксом другого магазина — тоже как есть: такой handle в магазине `shop` ничего не найдёт.
 */
export function toShopHandle({ shop, handle }: { shop: string; handle: string }): string {
  return splitStoredHandle(handle).shop === null ? toStoredHandle({ shop, handle }) : handle;
}

/**
 * Только простые объекты: у экземпляров классов (`Date`, `BigNumber` цен Medusa) свой `toJSON`, копия через
 * `Object.fromEntries` его потеряет.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/** Поля ответов Store API с handle сущностей Medusa: товар, категория, коллекция, строка корзины и заказа. */
export const PUBLIC_HANDLE_KEYS: ReadonlySet<string> = new Set(["handle", "product_handle"]);

/**
 * Ответ Store API → тот же ответ с handle без префикса магазина: обходит вложенные объекты и массивы (категории
 * товара, родитель и дети категории, строки корзины) и меняет только строки в `PUBLIC_HANDLE_KEYS`.
 * Исходный объект не мутирует.
 */
export function toPublicHandles(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toPublicHandles);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      PUBLIC_HANDLE_KEYS.has(key) && typeof item === "string" ? toPublicHandle(item) : toPublicHandles(item),
    ]),
  );
}

/** Роут Store API с фильтром по handle в query: какие параметры перевести в handle магазина. */
export type StoreHandleParams = {
  /** Путь роута (`/store/products`). */
  matcher: string;
  /** Параметры query с handle витрины (`handle`) — строка или массив строк. */
  params: string[];
};

/**
 * Параметры query с handle витрины → handle магазина `shop` (`toShopHandle`): `{ handle: ["utyug"] }` →
 * `{ handle: ["olisaːutyug"] }`. Отдаёт только переведённые параметры; чего нет в query — не трогает.
 */
export function toShopHandleParams({
  shop,
  query,
  params,
}: {
  shop: string;
  query: Record<string, unknown>;
  params: string[];
}): Record<string, string | string[]> {
  const toShop = (handle: string) => toShopHandle({ shop, handle });
  return Object.fromEntries(
    params.flatMap((param): [string, string | string[]][] => {
      const value = query[param];
      if (typeof value === "string") return [[param, toShop(value)]];
      if (Array.isArray(value) && value.every((item) => typeof item === "string"))
        return [[param, value.map(toShop)]];
      return [];
    }),
  );
}

/**
 * Фильтр Query «сущности Medusa магазина» по префиксу handle: у категорий и коллекций нет канала продаж, а handle
 * каждой — `{магазин}ː…`. В slug магазина нет `%` и `_`, экранировать нечего.
 */
export const shopHandleFilter = (shop: string): { handle: { $like: string } } => ({
  handle: { $like: `${toStoredHandle({ shop, handle: "" })}%` },
});

/** Роут Store API сущности Medusa без канала продаж (категории, коллекции): список и карточка — только магазина ключа. */
export type StoreShopScopedRoute = {
  /** Путь списка (`/store/product-categories`); карточка — `{matcher}/:id`. */
  matcher: string;
  /** Сущность в Query. */
  entity: string;
  /** Для сообщения: «Не найдено в магазине: категория pcat_1». */
  label: string;
};

/**
 * Фильтры списка роута Medusa (`req.filterableFields`) + условие «только магазин `shop`»: через `$and`, чтобы не
 * перебить фильтр клиента по тому же `handle`. Исходные фильтры не мутирует.
 */
export function withShopHandleFilter(
  filters: Record<string, unknown>,
  shop: string,
): Record<string, unknown> {
  const and = Array.isArray(filters.$and) ? filters.$and : [];
  return { ...filters, $and: [...and, shopHandleFilter(shop)] };
}
