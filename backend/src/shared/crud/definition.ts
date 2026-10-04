import { MedusaError } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";
import type { z } from "@medusajs/framework/zod";

import type { DTO } from "../contract/dto";
import { isRecord } from "../query/narrow";

/** Строка таблицы сущности, как её отдаёт сервис модуля или Query. */
export type CRUDRow = { id: string } & Record<string, unknown>;

export const isCRUDRow = (value: unknown): value is CRUDRow => isRecord(value) && typeof value.id === "string";

/** Строки из ответа сервиса или Query: всё, что не строка с `id`, отбрасывается. */
export const toCRUDRows = (value: unknown): CRUDRow[] => (Array.isArray(value) ? value.filter(isCRUDRow) : []);

/** Одна строка, которая обязана быть (ответ `create`/`update`). */
export function toCRUDRow(value: unknown): CRUDRow {
  if (isCRUDRow(value)) return value;
  throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "CRUD: сервис модуля вернул не строку сущности");
}

/** Сущность для CRUD-фабрики: одно описание — команды, запросы, Actions и middleware админки. */
export type CRUDDefinition<TDTO extends DTO & { id: string }> = {
  /** Имя сущности в Query и в событиях (`brand` → `brand.created`); из него же id workflow и шагов. */
  entity: string;
  /** Ключ модуля в контейнере Medusa (`BRAND_MODULE`). */
  module: string;
  /** Имя модели в `MedusaService({ Brand })` — по нему сгенерированы методы `createBrands`, `listBrands`… */
  model: string;
  /** Множественное число модели, если не `model + "s"` (`Category` → `Categories`). */
  plural?: string;
  /** Для сообщений: «Не найдено: бренд brand_1». */
  label: string;
  /** Ключи ответа Admin API: `{ brand }` и `{ brands, count }`. */
  response: { one: string; many: string };
  /** Поля для Query: список и карточка в админке. Связи — через точку (`product_category.name`). */
  fields: string[];
  /** Поля для поиска `?q=` (подстрока, без учёта регистра). */
  search: string[];
  /**
   * Сущность магазина (поле `shop_id`): список — только текущего магазина админки (`x-shop-id`, без него — 400),
   * создание пишет его магазин, сменить магазин нельзя (поля нет в схемах). Доступ по id — строка в реестре
   * `shopOwnedRoutes` (`src/container/common/shop.ts`).
   * `{ through: "supplier" }` — магазин у связи внутри модуля (`supplier.shop_id`): список фильтруется по ней,
   * создание `shop_id` не пишет — магазин проверяет use‑case создания.
   */
  shopScoped?: boolean | { through: string };
  /** Поля для точного фильтра списка (`?category_id=`). */
  filters?: string[];
  /** Сортировка списка, по умолчанию — свежие сверху. */
  order?: Record<string, "ASC" | "DESC">;
  /**
   * Handle витрины: slug из `from` (название), уникальный в пределах `scope` (по умолчанию — среди всех).
   * Нет поля — у сущности нет своей страницы.
   */
  handle?: { from: string; scope?: string[] };
  /** zod-схемы тела POST: создание и изменение (в изменении все поля необязательны). */
  schemas: { create: z.ZodTypeAny; update: z.ZodTypeAny };
  /** Строка Query → DTO ответа. */
  toDTO: (row: CRUDRow) => TDTO;
};

type ServiceMethod = (...args: unknown[]) => Promise<unknown>;

/** Сгенерированные методы `MedusaService` для сущности — единственный путь записи для шагов фабрики. */
export function repository(
  container: MedusaContainer,
  definition: Pick<
    CRUDDefinition<DTO & { id: string }>,
    "module" | "model" | "plural"
  >,
) {
  const service = container.resolve<Record<string, ServiceMethod>>(
    definition.module,
  );
  const plural = definition.plural ?? `${definition.model}s`;
  const call = (method: string, ...args: unknown[]): Promise<unknown> =>
    service[`${method}${plural}`](...args);

  return {
    list: async (filters: Record<string, unknown>) =>
      toCRUDRows(await call("list", filters)),
    create: async (data: Record<string, unknown>) =>
      toCRUDRow(await call("create", data)),
    update: async (data: CRUDRow) => toCRUDRow(await call("update", data)),
    softDelete: async (ids: string[]) => {
      await call("softDelete", ids);
    },
    restore: async (ids: string[]) => {
      await call("restore", ids);
    },
    delete: async (ids: string[]) => {
      await call("delete", ids);
    },
  };
}
