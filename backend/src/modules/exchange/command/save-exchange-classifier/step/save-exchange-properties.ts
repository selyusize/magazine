import { textRecord } from "@shared/query/narrow";

import { createUpsertExchangeRowsStep } from "../../../step/upsert-exchange-rows";
import type { LinkedProperty } from "./link-exchange-properties";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Свойства: название из выгрузки, справочник значений дополняется (инкрементальная выгрузка может прислать только
 * новые значения), характеристика по совпадению названия — только если в админке её ещё не выбрали.
 */
export const saveExchangePropertiesStep = createUpsertExchangeRowsStep(
  "save-exchange-properties",
  (service) => ({
    list: (filters) => service.listExchangeProperties(filters),
    create: (rows) => service.createExchangeProperties(rows),
    update: (rows) => service.updateExchangeProperties(rows),
    delete: (ids) => service.deleteExchangeProperties(ids),
  }),
  (current, next: LinkedProperty) => {
    const values = { ...textRecord(current?.values), ...next.values };
    const attributeId = current?.attribute_id ?? next.attribute_id ?? null;
    if (current && current.name === next.name && same(current.values, values) && current.attribute_id === attributeId)
      return null;
    return { name: next.name, values, attribute_id: attributeId };
  },
  (current) => ({ name: current.name, values: textRecord(current.values), attribute_id: current.attribute_id }),
);
