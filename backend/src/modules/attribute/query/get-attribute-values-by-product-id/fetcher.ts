import { AbstractFetcher } from "@shared/query/abstract-fetcher";
import { Injectable } from "@shared/container";

import { numberOr, numberOrNull, oneOf, recordOf, recordOrNull, text, textOrNull } from "@shared/query/narrow";

import { ATTRIBUTE_TYPES } from "../../service/attribute-value";
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

type AttributeValueRow = AttributeValueDTO & { rank: number };

/** Строка Query → DTO; значение без характеристики (её удалили) — пусто. */
const toAttributeValueRow = (value: unknown): AttributeValueRow[] => {
  const row = recordOf(value);
  const attribute = recordOrNull(row.attribute);
  if (!attribute) return [];
  return [
    {
      id: text(row.id),
      attribute_id: text(row.attribute_id),
      attribute: {
        name: text(attribute.name),
        handle: text(attribute.handle),
        type: oneOf(attribute.type, ATTRIBUTE_TYPES, "string"),
        unit: textOrNull(attribute.unit),
      },
      variant_id: textOrNull(row.variant_id),
      value: text(row.value),
      handle: text(row.handle),
      number: numberOrNull(row.number),
      rank: numberOr(attribute.rank),
    },
  ];
};

/** Строки Query → DTO в порядке таблицы характеристик (rank, название), значения одной характеристики — по алфавиту. */
export const toAttributeValueDTOs = (rows: unknown[]): AttributeValueDTO[] =>
  rows
    .flatMap(toAttributeValueRow)
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.attribute.name.localeCompare(b.attribute.name, "ru") ||
        a.value.localeCompare(b.value, "ru"),
    )
    .map(({ rank: _rank, ...dto }) => dto);

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
