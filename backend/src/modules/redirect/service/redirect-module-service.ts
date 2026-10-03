import type { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils";

import { EntityPath, type EntityPathEntity } from "../entity/entity-path";
import { Redirect, type RedirectEntity } from "../entity/redirect";
import { assertRedirect, normalizePath, type RedirectCode } from "./path";

export type RedirectRow = Pick<
  RedirectEntity,
  "id" | "from_path" | "to_path" | "code" | "entity_type" | "entity_id"
>;

export type RedirectInput = {
  from_path: string;
  to_path: string | null;
  code: RedirectCode;
  entity_type?: string | null;
  entity_id?: string | null;
};

/** Текущий путь сущности на витрине. */
export type EntityPathInput = {
  entity_type: string;
  entity_id: string;
  path: string;
};

/** Сущность переехала: со старого пути нужен 301 на новый. */
export type EntityPathMove = {
  entity_type: string;
  entity_id: string;
  from_path: string;
  to_path: string;
};

/** Откат `trackEntityPaths`: созданные записи путей, прежние пути изменённых и снятые с живых путей правила. */
export type TrackedPathChanges = {
  created: string[];
  updated: Pick<EntityPathEntity, "id" | "path">[];
  redirects: RedirectChanges;
};

/** Что изменилось в таблице — для отката шага: созданные id и состояние строк до изменения/удаления. */
export type RedirectChanges = {
  created: string[];
  updated: RedirectRow[];
  deleted: RedirectRow[];
};

const toRow = (redirect: RedirectEntity): RedirectRow => ({
  id: redirect.id,
  from_path: redirect.from_path,
  to_path: redirect.to_path,
  code: redirect.code,
  entity_type: redirect.entity_type,
  entity_id: redirect.entity_id,
});

/** Таблицы редиректов и путей сущностей. Пишут только шаги команд модуля redirect. */
export class RedirectModuleService extends MedusaService({
  Redirect,
  EntityPath,
}) {
  /**
   * Сохраняет правила так, чтобы цепочек не было: цель, которая сама редиректит, заменяется конечной,
   * а правила, ведущие на `from_path`, перенаправляются на новую цель. Существующее правило с тем же
   * `from_path` перезаписывается. Всё — одной транзакцией.
   */
  @InjectManager()
  async saveRedirects(
    inputs: RedirectInput[],
    @MedusaContext() sharedContext: Context = {},
  ): Promise<{ redirects: RedirectRow[]; changes: RedirectChanges }> {
    return this.saveRedirects_(inputs, sharedContext);
  }

  /** Путь снова открыт (на нём живая страница) — правило с него удаляем. */
  @InjectManager()
  async releasePath(
    path: string,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<RedirectChanges> {
    return this.releasePath_(path, sharedContext);
  }

  /**
   * Запоминает текущие пути сущностей и снимает правила с этих путей (на них живые страницы — иначе витрина
   * уведёт со страницы). Возвращает переезды: путь сменился → нужен 301 со старого. Всё — одной транзакцией.
   */
  @InjectManager()
  async trackEntityPaths(
    inputs: EntityPathInput[],
    @MedusaContext() sharedContext: Context = {},
  ): Promise<{ moves: EntityPathMove[]; changes: TrackedPathChanges }> {
    return this.trackEntityPaths_(inputs, sharedContext);
  }

  /** Откат `trackEntityPaths`. */
  @InjectManager()
  async revertTrackedPaths(
    changes: TrackedPathChanges,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<void> {
    return this.revertTrackedPaths_(changes, sharedContext);
  }

  /** Откат `saveRedirects` / `releasePath` / удаления: возвращает строки в состояние до изменения. */
  @InjectManager()
  async revertRedirectChanges(
    changes: RedirectChanges,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<void> {
    return this.revertRedirectChanges_(changes, sharedContext);
  }

  @InjectTransactionManager()
  protected async saveRedirects_(
    inputs: RedirectInput[],
    @MedusaContext() sharedContext: Context = {},
  ): Promise<{ redirects: RedirectRow[]; changes: RedirectChanges }> {
    const changes: RedirectChanges = { created: [], updated: [], deleted: [] };
    const redirects: RedirectRow[] = [];

    for (const input of inputs) {
      redirects.push(await this.saveRedirect_(input, changes, sharedContext));
    }
    return { redirects, changes };
  }

  @InjectTransactionManager()
  protected async releasePath_(
    path: string,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<RedirectChanges> {
    const changes: RedirectChanges = { created: [], updated: [], deleted: [] };
    const [redirect] = await this.listRedirects(
      { from_path: normalizePath(path) },
      {},
      sharedContext,
    );

    if (redirect) {
      changes.deleted.push(toRow(redirect));
      await this.deleteRedirects(redirect.id, sharedContext);
    }
    return changes;
  }

  @InjectTransactionManager()
  protected async trackEntityPaths_(
    inputs: EntityPathInput[],
    @MedusaContext() sharedContext: Context = {},
  ): Promise<{ moves: EntityPathMove[]; changes: TrackedPathChanges }> {
    const moves: EntityPathMove[] = [];
    const changes: TrackedPathChanges = {
      created: [],
      updated: [],
      redirects: { created: [], updated: [], deleted: [] },
    };

    for (const input of inputs) {
      const path = normalizePath(input.path);
      const released = await this.releasePath_(path, sharedContext);
      changes.redirects.deleted.push(...released.deleted);

      const [current] = await this.listEntityPaths(
        { entity_type: input.entity_type, entity_id: input.entity_id },
        {},
        sharedContext,
      );
      if (!current) {
        const created = await this.createEntityPaths(
          { ...input, path },
          sharedContext,
        );
        changes.created.push(created.id);
        continue;
      }
      if (current.path === path) continue;

      changes.updated.push({ id: current.id, path: current.path });
      await this.updateEntityPaths({ id: current.id, path }, sharedContext);
      moves.push({
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        from_path: current.path,
        to_path: path,
      });
    }
    return { moves, changes };
  }

  @InjectTransactionManager()
  protected async revertTrackedPaths_(
    changes: TrackedPathChanges,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<void> {
    if (changes.created.length)
      await this.deleteEntityPaths(changes.created, sharedContext);
    for (const row of changes.updated)
      await this.updateEntityPaths(row, sharedContext);
    await this.revertRedirectChanges_(changes.redirects, sharedContext);
  }

  @InjectTransactionManager()
  protected async revertRedirectChanges_(
    changes: RedirectChanges,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<void> {
    if (changes.created.length)
      await this.deleteRedirects(changes.created, sharedContext);
    // С конца: если строку меняли дважды, побеждает самое раннее состояние
    for (const row of [...changes.updated].reverse())
      await this.updateRedirects(row, sharedContext);
    if (changes.deleted.length)
      await this.createRedirects(changes.deleted, sharedContext);
  }

  /** Одно правило; `changes` копит всё, что тронуто, — для отката. */
  @InjectTransactionManager()
  protected async saveRedirect_(
    input: RedirectInput,
    changes: RedirectChanges,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<RedirectRow> {
    const from_path = normalizePath(input.from_path);
    let to_path = input.to_path === null ? null : normalizePath(input.to_path);
    let code = input.code;
    assertRedirect({ from_path, to_path, code });

    // Цель сама переехала — ведём сразу в конец (цепочек в таблице нет, поэтому хватает одного шага)
    if (to_path !== null) {
      const [next] = await this.listRedirects(
        { from_path: to_path },
        {},
        sharedContext,
      );
      if (next) {
        to_path = next.to_path;
        if (to_path === null) code = 410;
      }
    }
    if (to_path === from_path) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Редирект ${from_path} → ${input.to_path} замыкается в цикл: ${input.to_path} уже ведёт на ${from_path}`,
      );
    }
    assertRedirect({ from_path, to_path, code });

    // Кто вёл на from_path — теперь ведёт туда же, куда и он
    const incoming = await this.listRedirects(
      { to_path: from_path },
      {},
      sharedContext,
    );
    for (const redirect of incoming) {
      if (redirect.from_path === to_path) {
        changes.deleted.push(toRow(redirect));
        await this.deleteRedirects(redirect.id, sharedContext);
        continue;
      }
      changes.updated.push(toRow(redirect));
      await this.updateRedirects(
        {
          id: redirect.id,
          to_path,
          code: to_path === null ? 410 : redirect.code,
        },
        sharedContext,
      );
    }

    const data = {
      from_path,
      to_path,
      code,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
    };
    const [existing] = await this.listRedirects(
      { from_path },
      {},
      sharedContext,
    );
    if (existing) {
      changes.updated.push(toRow(existing));
      return toRow(
        await this.updateRedirects({ id: existing.id, ...data }, sharedContext),
      );
    }

    const created = await this.createRedirects(data, sharedContext);
    changes.created.push(created.id);
    return toRow(created);
  }
}
