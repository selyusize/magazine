import type { CMLRecord } from "./commerceml/reader";
import type { CMLGroup, CMLOffer, CMLPriceType, CMLProduct, CMLProperty } from "./commerceml/types";

/** Что обработчик запуска получает из файла: справочники целиком, товары и предложения — пачками. */
export type RecordBatch =
  | { kind: "classifier"; groups: CMLGroup[]; properties: CMLProperty[] }
  | { kind: "price_types"; price_types: CMLPriceType[] }
  | { kind: "package"; only_changes: boolean }
  | { kind: "invalid"; message: string }
  /** `position` — сколько товаров (предложений) файла обработано вместе с этой пачкой: курсор запуска. */
  | { kind: "products"; products: CMLProduct[]; position: number }
  | { kind: "offers"; offers: CMLOffer[]; position: number };

/**
 * Поток записей файла → пачки по `batch_size`. Классификатор отдаётся одним куском перед первым товаром.
 * Предложения одного товара не разрываются между пачками (если идут подряд, как во всех известных выгрузках):
 * карточка создаётся сразу со всеми вариантами. Первые `skip` товаров/предложений пропускаются — продолжение
 * запуска после падения.
 */
export async function* batchRecords(
  records: AsyncIterable<CMLRecord>,
  options: { batch_size: number; skip: number },
): AsyncGenerator<RecordBatch, void, undefined> {
  let groups: CMLGroup[] = [];
  let properties: CMLProperty[] = [];
  let products: CMLProduct[] = [];
  let offers: CMLOffer[] = [];
  let position = 0;

  const classifier = function* (): Generator<RecordBatch> {
    if (!groups.length && !properties.length) return;
    yield { kind: "classifier", groups, properties };
    groups = [];
    properties = [];
  };
  const flush = function* (): Generator<RecordBatch> {
    if (products.length) yield { kind: "products", products, position };
    if (offers.length) yield { kind: "offers", offers, position };
    products = [];
    offers = [];
  };

  for await (const record of records) {
    switch (record.kind) {
      case "groups":
        groups.push(...record.groups);
        break;
      case "properties":
        properties.push(...record.properties);
        break;
      case "price_types":
      case "package":
      case "invalid":
        yield record;
        break;
      case "product":
        yield* classifier();
        if (++position <= options.skip) break;
        products.push(record.product);
        if (products.length >= options.batch_size) yield* flush();
        break;
      case "offer": {
        yield* classifier();
        const last = offers[offers.length - 1];
        if (offers.length >= options.batch_size && last?.product_external_id !== record.offer.product_external_id)
          yield* flush();
        if (++position <= options.skip) break;
        offers.push(record.offer);
        break;
      }
    }
  }
  yield* classifier();
  yield* flush();
}
