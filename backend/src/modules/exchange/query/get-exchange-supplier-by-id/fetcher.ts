import { MedusaError } from "@medusajs/framework/utils";

import { Injectable } from "@shared/container";
import { AbstractFetcher } from "@shared/query/abstract-fetcher";

import { toExchangeSettings } from "../../service/exchange-settings";
import type { ExchangeSupplierDTO } from "./dto";
import type { GetExchangeSupplierByIdQuery } from "./query";

/** Поставщик и его настройки обмена (`supplier.exchange`, `supplier.markup`). Нет — NOT_FOUND. */
@Injectable()
export class GetExchangeSupplierByIdFetcher extends AbstractFetcher<GetExchangeSupplierByIdQuery, ExchangeSupplierDTO> {
  async fetch(query: GetExchangeSupplierByIdQuery): Promise<ExchangeSupplierDTO> {
    const { data } = await this.graph({
      entity: "supplier",
      fields: ["id", "name", "is_active", "exchange", "markup"],
      filters: { id: query.supplier_id },
    });
    const supplier = data[0];
    if (!supplier) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Поставщик ${query.supplier_id} не найден`);
    return {
      id: supplier.id,
      name: supplier.name,
      is_active: Boolean(supplier.is_active),
      settings: toExchangeSettings(supplier.exchange, supplier.markup),
    };
  }
}
