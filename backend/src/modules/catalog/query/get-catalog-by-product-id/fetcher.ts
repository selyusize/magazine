import { MedusaError } from "@medusajs/framework/utils";

import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { Injectable } from "@shared/container";

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

const toNamed = (row: Named | null | undefined): Named | null =>
  row ? { id: row.id, name: row.name, handle: row.handle } : null;

/** Строка товара с полями `PRODUCT_CATALOG_FIELDS` → DTO. */
export const toProductCatalogDTO = (
  product: Record<string, unknown> & { id: string },
): ProductCatalogDTO => {
  const main = product.product_main_category as
    { product_category?: Named | null } | null | undefined;
  const categories = (product.categories ?? []) as (Named | null)[];
  return {
    product_id: product.id,
    brand: toNamed(product.brand as Named | null | undefined),
    main_category: toNamed(main?.product_category),
    categories: categories.flatMap((category) =>
      category ? [toNamed(category)!] : [],
    ),
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
    return toProductCatalogDTO(
      data[0] as Record<string, unknown> & { id: string },
    );
  }
}
