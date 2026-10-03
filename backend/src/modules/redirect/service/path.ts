import { MedusaError } from "@medusajs/framework/utils";

import { isString, recordOrNull, records, text, textOrNull } from "@shared/query/narrow";

/** 301 — переехало навсегда, 302 — временно, 410 — страницы больше нет. */
export const REDIRECT_CODES = [301, 302, 410] as const;
export type RedirectCode = (typeof REDIRECT_CODES)[number];

export const isRedirectCode = (code: number): code is RedirectCode => REDIRECT_CODES.some((item) => item === code);

/** Сущности, у которых есть своя страница на витрине. */
export const URL_ENTITY_TYPES = [
  "product",
  "product_category",
  "product_collection",
  "brand",
  "article",
  "filter_page",
] as const;
export type URLEntityType = (typeof URL_ENTITY_TYPES)[number];

/** Строка Query с полями из `URL_ENTITIES[type].fields`. */
export type URLEntityRow = { id: string } & Record<string, unknown>;

/** Строки Query сущности с адресом: без `id` строка не годится. */
export const toURLEntityRows = (rows: unknown[]): URLEntityRow[] =>
  records(rows).flatMap((row) => (isString(row.id) ? [{ ...row, id: row.id }] : []));

type URLEntity = {
  /** Сущность в Query. */
  entity: string;
  /** Поле названия — из него slug, если handle пуст после транслитерации. */
  title: string;
  /** Поля для Query: handle, название и всё, что нужно пути. */
  fields: string[];
  /**
   * Handle задаёт Medusa (товар, категория, коллекция) — он может прийти кириллицей, и его переименовывает
   * `sync-entity-url`. Свои сущности получают slug сразу при сохранении (CRUD-фабрика), их не переименовываем.
   */
  renamable: boolean;
  /** Запасной slug: `{prefix}-{хвост id}`. */
  prefix: string;
  /** Путь на витрине; `null` — страницы нет (у посадочной не нашлась категория). */
  toPath: (row: URLEntityRow) => string | null;
};

const handleOf = (row: URLEntityRow): string => text(row.handle);

/** Пути страниц сущностей. Должны совпадать с `frontend/src/shared/config/routes.ts`. */
export const URL_ENTITIES: Record<URLEntityType, URLEntity> = {
  product: {
    entity: "product",
    title: "title",
    fields: ["id", "handle", "title"],
    renamable: true,
    prefix: "product",
    toPath: (row) => `/products/${handleOf(row)}`,
  },
  product_category: {
    entity: "product_category",
    title: "name",
    fields: ["id", "handle", "name"],
    renamable: true,
    prefix: "category",
    toPath: (row) => `/catalog/${handleOf(row)}`,
  },
  product_collection: {
    entity: "product_collection",
    title: "title",
    fields: ["id", "handle", "title"],
    renamable: true,
    prefix: "collection",
    toPath: (row) => `/collections/${handleOf(row)}`,
  },
  brand: {
    entity: "brand",
    title: "name",
    fields: ["id", "handle", "name"],
    renamable: false,
    prefix: "brand",
    toPath: (row) => `/brands/${handleOf(row)}`,
  },
  article: {
    entity: "article",
    title: "title",
    fields: ["id", "handle", "title"],
    renamable: false,
    prefix: "article",
    toPath: (row) => `/blog/${handleOf(row)}`,
  },
  filter_page: {
    entity: "filter_page",
    title: "title",
    fields: ["id", "handle", "title", "category_id", "product_category.handle"],
    renamable: false,
    prefix: "filter-page",
    toPath: (row) => {
      const categoryHandle = textOrNull(recordOrNull(row.product_category)?.handle);
      return categoryHandle ? `/catalog/${categoryHandle}/${handleOf(row)}` : null;
    },
  },
};

/** Путь страницы сущности на витрине; `null` — страницы нет. */
export function toEntityPath(
  entityType: URLEntityType,
  row: URLEntityRow,
): string | null {
  return URL_ENTITIES[entityType].toPath(row);
}

/**
 * Один путь — одна запись: без домена, query и якоря, с ведущим и без завершающего слеша, в декодированном виде.
 * `https://olisa.ru/Products/x/?a=1` → `/Products/x`; `%D1%84` → `ф`. Регистр не трогаем — пути на витрине регистрозависимы.
 */
export function normalizePath(input: string): string {
  let path = input.trim();

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) {
    if (!URL.canParse(path)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Некорректный адрес «${input}»`,
      );
    }
    path = new URL(path).pathname;
  }

  path = decodePath(path.split(/[?#]/)[0]);

  path = `/${path}`.replace(/\/{2,}/g, "/");
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** `%D1%84` → `ф`; битую %-последовательность оставляем как есть — такой путь тоже приходит от поисковиков. */
function decodePath(path: string): string {
  return path.replace(/(?:%[0-9a-f]{2})+/gi, (sequence) => {
    const bytes = sequence
      .match(/%([0-9a-f]{2})/gi)!
      .map((byte) => parseInt(byte.slice(1), 16));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(
      new Uint8Array(bytes),
    );
    return decoded.includes("\uFFFD") || /[/?#%]/.test(decoded)
      ? sequence
      : decoded;
  });
}

/** Что не так с правилом: 410 — без цели, 301/302 — с целью и не на самого себя. `null` — всё в порядке. */
export function findRedirectProblem(redirect: {
  from_path: string;
  to_path: string | null;
  code: number;
}): string | null {
  const { from_path, to_path, code } = redirect;

  if (!isRedirectCode(code))
    return `код ${code} — допустимы 301, 302, 410`;
  if (code === 410 && to_path !== null)
    return "у кода 410 не бывает адреса назначения";
  if (code !== 410 && to_path === null)
    return `для кода ${code} нужен адрес назначения`;
  if (from_path === to_path) return "редирект ведёт сам на себя";
  return null;
}

/** Бросает INVALID_DATA, если правило несогласовано (см. `findRedirectProblem`). */
export function assertRedirect(redirect: {
  from_path: string;
  to_path: string | null;
  code: number;
}): void {
  const problem = findRedirectProblem(redirect);
  if (problem)
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Редирект ${redirect.from_path}: ${problem}`,
    );
}
