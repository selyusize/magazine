import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { dateOrNull } from "@shared/query/narrow";

import { toExchangeSettings } from "../../service/exchange-settings";
import type { SupplierDueForPullDTO } from "./dto";
import type { FindSuppliersDueForPullQuery } from "./query";

const ACTIVE_STATUSES = ["receiving", "queued", "running"];

/**
 * Активные поставщики с `pull`, у которых нет идущего запуска, а последний запуск старше их интервала. Поставщиков
 * немного (десятки), поэтому настройки JSON разбираются здесь, а не фильтром в БД. Некого — пусто.
 */
@Injectable()
export class FindSuppliersDueForPullFetcher extends AbstractFetcher<
  FindSuppliersDueForPullQuery,
  SupplierDueForPullDTO[]
> {
  async fetch(query: FindSuppliersDueForPullQuery): Promise<SupplierDueForPullDTO[]> {
    const { data: suppliers } = await this.graph({
      entity: "supplier",
      fields: ["id", "exchange", "markup"],
      filters: { is_active: true },
    });
    const pulling = suppliers
      .map((supplier) => ({ id: supplier.id, settings: toExchangeSettings(supplier.exchange, supplier.markup) }))
      .filter((supplier) => supplier.settings.mode === "pull" && supplier.settings.urls.length > 0);
    if (!pulling.length) return [];

    const { data: runs } = await this.graph({
      entity: "import_run",
      fields: ["supplier_id", "status", "created_at"],
      filters: { supplier_id: pulling.map((supplier) => supplier.id), source: ["pull", "manual"] },
      pagination: { order: { created_at: "DESC" } },
    });
    const now = new Date(query.now).getTime();

    return pulling
      .filter((supplier) => {
        const own = runs.filter((run) => run.supplier_id === supplier.id);
        if (own.some((run) => ACTIVE_STATUSES.includes(run.status))) return false;
        const last = dateOrNull(own[0]?.created_at)?.getTime() ?? 0;
        return now - last >= supplier.settings.pull_interval_minutes * 60_000;
      })
      .map((supplier) => ({ supplier_id: supplier.id }));
  }
}
