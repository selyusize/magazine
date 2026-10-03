import type { MedusaContainer } from "@medusajs/framework/types";
import type { z } from "@medusajs/framework/zod";

import type { DTO } from "../contract/dto";

/** Строка таблицы сущности, как её отдаёт сервис модуля или Query. */
export type CRUDRow = { id: string } & Record<string, unknown>;

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
  const call = <T>(method: string, ...args: unknown[]): Promise<T> =>
    service[`${method}${plural}`](...args) as Promise<T>;

  return {
    list: (filters: Record<string, unknown>) =>
      call<CRUDRow[]>("list", filters),
    create: (data: Record<string, unknown>) => call<CRUDRow>("create", data),
    update: (data: CRUDRow) => call<CRUDRow>("update", data),
    softDelete: (ids: string[]) => call<void>("softDelete", ids),
    restore: (ids: string[]) => call<void>("restore", ids),
    delete: (ids: string[]) => call<void>("delete", ids),
  };
}
