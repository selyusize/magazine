import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { Injectable } from "@shared/container";

import type { AttributeValueDTO } from "./dto";
import type { GetAttributeValuesByProductIdQuery } from "./query";

/** Поля для `toAttributeValueDTO` — их же читает команда `set-attribute-values-for-product` для ответа. */
export const ATTRIBUTE_VALUE_FIELDS = [
  "id",
  "attribute_id",
  "attribute.name",
  "attribute.handle",
  "attribute.type",
  "attribute.unit",
  "attribute.rank",
  "variant_id",
  "value",
  "handle",
  "number",
];

type AttributeValueRow = Omit<AttributeValueDTO, "attribute"> & {
  attribute: AttributeValueDTO["attribute"] & { rank: number };
};

const toAttributeValueDTO = (row: AttributeValueRow): AttributeValueDTO => ({
  id: row.id,
  attribute_id: row.attribute_id,
  attribute: {
    name: row.attribute.name,
    handle: row.attribute.handle,
    type: row.attribute.type,
    unit: row.attribute.unit ?? null,
  },
  variant_id: row.variant_id ?? null,
  value: row.value,
  handle: row.handle,
  number: row.number ?? null,
});

/** Строки Query → DTO в порядке таблицы характеристик (rank, название), значения одной характеристики — по алфавиту. */
export const toAttributeValueDTOs = (rows: unknown[]): AttributeValueDTO[] =>
  (rows as AttributeValueRow[])
    .filter((row) => row.attribute)
    .sort(
      (a, b) =>
        a.attribute.rank - b.attribute.rank ||
        a.attribute.name.localeCompare(b.attribute.name, "ru") ||
        a.value.localeCompare(b.value, "ru"),
    )
    .map(toAttributeValueDTO);

/** Характеристики товара и его вариантов — блок «Характеристики» в карточке. Нет значений — пустой список. */
@Injectable()
export class GetAttributeValuesByProductIdFetcher extends AbstractFetcher<
  GetAttributeValuesByProductIdQuery,
  AttributeValueDTO[]
> {
  async fetch(
    query: GetAttributeValuesByProductIdQuery,
  ): Promise<AttributeValueDTO[]> {
    const { data } = await this.graph({
      entity: "attribute_value",
      fields: ATTRIBUTE_VALUE_FIELDS,
      filters: { product_id: query.product_id },
    });
    return toAttributeValueDTOs(data);
  }
}
