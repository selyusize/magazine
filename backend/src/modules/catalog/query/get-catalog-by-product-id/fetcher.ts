import { MedusaError } from "@medusajs/framework/utils";

import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { Injectable } from "@shared/container";

import { recordOf, recordOrNull, records, text } from "@shared/query/narrow";
import { toPublicHandle } from "@shared/shop/shop-handle";

import type { ProductCatalogDTO } from "./dto";
import type { GetCatalogByProductIdQuery } from "./query";

type Named = { id: string; name: string; handle: string };

/** Поля товара для `toProductCatalogDTO` — их же читает команда `update-catalog-for-product` для ответа. */
export const PRODUCT_CATALOG_FIELDS = [
  "id",
  "brand.id",
  "brand.name",
  "brand.handle",
  "product_main_category.product_category.id",
  "product_main_category.product_category.name",
  "product_main_category.product_category.handle",
  "categories.id",
  "categories.name",
  "categories.handle",
];

/** Handle — витрины: у категории в БД он с префиксом магазина, у бренда — свой. */
const toNamed = (value: unknown): Named | null => {
  const row = recordOrNull(value);
  return row ? { id: text(row.id), name: text(row.name), handle: toPublicHandle(text(row.handle)) } : null;
};

/** Строка товара с полями `PRODUCT_CATALOG_FIELDS` → DTO. */
export const toProductCatalogDTO = (value: unknown): ProductCatalogDTO => {
  const product = recordOf(value);
  return {
    product_id: text(product.id),
    brand: toNamed(product.brand),
    main_category: toNamed(recordOrNull(product.product_main_category)?.product_category),
    categories: records(product.categories).flatMap((category) => toNamed(category) ?? []),
  };
};

/** Бренд и категории товара — блок «Каталог» в карточке товара в админке. Нет товара — 404. */
@Injectable()
export class GetCatalogByProductIdFetcher extends AbstractFetcher<
  GetCatalogByProductIdQuery,
  ProductCatalogDTO
> {
  async fetch(query: GetCatalogByProductIdQuery): Promise<ProductCatalogDTO> {
    const { data } = await this.graph({
      entity: "product",
      fields: PRODUCT_CATALOG_FIELDS,
      filters: { id: query.product_id },
    });
    if (!data[0])
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Товар ${query.product_id} не найден`,
      );
    return toProductCatalogDTO(data[0]);
  }
}
