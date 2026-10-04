import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
  type MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";

import { AbstractCommandHandler } from "../command/abstract-command-handler";
import { Injectable } from "../container/injectable";
import type { Action } from "../contract/action";
import type { Command } from "../contract/command";
import type { DTO } from "../contract/dto";
import { AbstractFetcher } from "../query/abstract-fetcher";
import { requireAdminShop, type ShopContext } from "../shop/shop-context";
import { type CRUDDefinition, toCRUDRows } from "./definition";
import {
  createCRUDWorkflows,
  type DeleteEntitiesCommand,
  type UpdateEntityCommand,
} from "./workflows";

export type ListEntitiesQuery = {
  q?: string;
  limit: number;
  offset: number;
  /** Точные фильтры; магазин через связь — вложенным объектом (`{ supplier: { shop_id } }`). */
  filters: Record<string, string | Record<string, string>>;
};

export type EntitiesPageDTO<TDTO extends DTO> = { rows: TDTO[]; count: number };

type ListParams = { q?: string; limit: number; offset: number } & Record<
  string,
  string | number | undefined
>;
type Request<
  TBody = unknown,
  TQuery extends Record<string, unknown> = Record<string, unknown>,
> = AuthenticatedMedusaRequest<TBody, TQuery>;

/** Запросы роутов фабрики: список (`?q=&limit=&offset=` + фильтры) и тело POST. */
export type CRUDListRequest = Request<unknown, ListParams>;
export type CRUDBodyRequest = Request<Command>;

/**
 * CRUD сущности по одному описанию — те же слои, что у рукописного use‑case (arch-guide, п.3–7):
 * Handler → workflow с откатом и событием, Fetcher → Query, Action → HTTP. Модуль экспортирует результат из
 * `crud.ts`, роуты `src/api/admin/{resource}` берут Actions через контейнер, middleware — `middlewares(path)`.
 *
 * Своё поведение (проверки, доп. шаги) — отдельный use‑case рядом, фабрика его не заменяет.
 */
export function defineCRUD<TDTO extends DTO & { id: string }>(
  definition: CRUDDefinition<TDTO>,
) {
  const workflows = createCRUDWorkflows(definition);
  const { response, label } = definition;
  const { shopScoped } = definition;
  /** Магазин запроса в новую строку: только у сущности со своим `shop_id`. */
  const shopOf = (req: { shop?: ShopContext }): { shop_id?: string } =>
    shopScoped === true ? { shop_id: requireAdminShop(req).id } : {};
  /** Фильтр списка по магазину запроса: своё поле или поле связи; сетевой сущности — ничего. */
  const shopFilterOf = (req: { shop?: ShopContext }): ListEntitiesQuery["filters"] => {
    if (!shopScoped) return {};
    const shop_id = requireAdminShop(req).id;
    return shopScoped === true ? { shop_id } : { [shopScoped.through]: { shop_id } };
  };

  @Injectable()
  class CreateHandler extends AbstractCommandHandler<Command, TDTO> {
    protected readonly workflow = workflows.create;
  }

  @Injectable()
  class UpdateHandler extends AbstractCommandHandler<
    UpdateEntityCommand,
    TDTO
  > {
    protected readonly workflow = workflows.update;
  }

  @Injectable()
  class DeleteHandler extends AbstractCommandHandler<
    DeleteEntitiesCommand,
    void
  > {
    protected readonly workflow = workflows.delete;
  }

  @Injectable()
  class ListFetcher extends AbstractFetcher<
    ListEntitiesQuery,
    EntitiesPageDTO<TDTO>
  > {
    async fetch(query: ListEntitiesQuery): Promise<EntitiesPageDTO<TDTO>> {
      const pattern = query.q
        ? `%${query.q.replace(/[%_\\]/g, "\\$&")}%`
        : null;
      const search = pattern
        ? {
            $or: definition.search.map((field) => ({
              [field]: { $ilike: pattern },
            })),
          }
        : {};

      const { data, metadata } = await this.graph({
        entity: definition.entity,
        fields: definition.fields,
        filters: { ...query.filters, ...search },
        pagination: {
          skip: query.offset,
          take: query.limit,
          order: definition.order ?? { created_at: "DESC" },
        },
      });
      return {
        rows: toCRUDRows(data).map(definition.toDTO),
        count: metadata?.count ?? data.length,
      };
    }
  }

  @Injectable()
  class GetFetcher extends AbstractFetcher<{ id: string }, TDTO> {
    async fetch(query: { id: string }): Promise<TDTO> {
      const { data } = await this.graph({
        entity: definition.entity,
        fields: definition.fields,
        filters: { id: query.id },
      });
      const [row] = toCRUDRows(data);
      if (!row)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Не найдено: ${label} ${query.id}`,
        );
      return definition.toDTO(row);
    }
  }

  /** Страница списка с поиском и фильтрами — GET /admin/{resource}. */
  @Injectable()
  class ListAction implements Action<Request<unknown, ListParams>> {
    constructor(private readonly fetcher: ListFetcher) {}

    async handle(
      req: Request<unknown, ListParams>,
      res: MedusaResponse,
    ): Promise<void> {
      const { q, limit, offset, ...rest } = req.validatedQuery;
      const filters = {
        ...Object.fromEntries(
          (definition.filters ?? []).flatMap((field) =>
            rest[field] ? [[field, String(rest[field])]] : [],
          ),
        ),
        ...shopFilterOf(req),
      };
      const { rows, count } = await this.fetcher.fetch({
        q: q || undefined,
        limit,
        offset,
        filters,
      });
      res.json({ [response.many]: rows, count, limit, offset });
    }
  }

  /** Карточка — GET /admin/{resource}/:id. */
  @Injectable()
  class GetAction implements Action<Request> {
    constructor(private readonly fetcher: GetFetcher) {}

    async handle(req: Request, res: MedusaResponse): Promise<void> {
      res.json({
        [response.one]: await this.fetcher.fetch({ id: req.params.id }),
      });
    }
  }

  /** Создание — POST /admin/{resource}. */
  @Injectable()
  class CreateAction implements Action<Request<Command>> {
    constructor(private readonly handler: CreateHandler) {}

    async handle(req: Request<Command>, res: MedusaResponse): Promise<void> {
      const entity = await this.handler.handle({
        ...req.validatedBody,
        ...shopOf(req),
      });
      res.status(201).json({ [response.one]: entity });
    }
  }

  /** Изменение — POST /admin/{resource}/:id (как в Admin API Medusa). */
  @Injectable()
  class UpdateAction implements Action<Request<Command>> {
    constructor(private readonly handler: UpdateHandler) {}

    async handle(req: Request<Command>, res: MedusaResponse): Promise<void> {
      const entity = await this.handler.handle({
        ...req.validatedBody,
        id: req.params.id,
      });
      res.json({ [response.one]: entity });
    }
  }

  /** Удаление — DELETE /admin/{resource}/:id, ответ как у DELETE в Admin API Medusa. */
  @Injectable()
  class DeleteAction implements Action<Request> {
    constructor(private readonly handler: DeleteHandler) {}

    async handle(req: Request, res: MedusaResponse): Promise<void> {
      await this.handler.handle({ ids: [req.params.id] });
      res.json({ id: req.params.id, object: definition.entity, deleted: true });
    }
  }

  const listSchema = z.object({
    q: z.string().trim().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    ...Object.fromEntries(
      (definition.filters ?? []).map((field) => [
        field,
        z.string().trim().max(200).optional(),
      ]),
    ),
  });

  /** Валидация роутов `{path}` и `{path}/:id`; авторизацию /admin/* Medusa проверяет сама. */
  const middlewares = (path: string): MiddlewareRoute[] => [
    {
      method: ["GET"],
      matcher: path,
      middlewares: [validateAndTransformQuery(listSchema, {})],
    },
    {
      method: ["POST"],
      matcher: path,
      middlewares: [validateAndTransformBody(definition.schemas.create)],
    },
    {
      method: ["POST"],
      matcher: `${path}/:id`,
      middlewares: [validateAndTransformBody(definition.schemas.update)],
    },
  ];

  return {
    workflows,
    handlers: {
      create: CreateHandler,
      update: UpdateHandler,
      delete: DeleteHandler,
    },
    fetchers: { list: ListFetcher, get: GetFetcher },
    actions: {
      list: ListAction,
      get: GetAction,
      create: CreateAction,
      update: UpdateAction,
      delete: DeleteAction,
    },
    middlewares,
  };
}
