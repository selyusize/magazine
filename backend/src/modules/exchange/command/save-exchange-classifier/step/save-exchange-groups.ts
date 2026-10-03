import type { CMLGroup } from "../../../service/commerceml/types";
import { createUpsertExchangeRowsStep } from "../../../step/upsert-exchange-rows";

/** Группы: название и родитель — из выгрузки, категория магазина (`category_id`) остаётся из админки. */
export const saveExchangeGroupsStep = createUpsertExchangeRowsStep(
  "save-exchange-groups",
  (service) => ({
    list: (filters) => service.listExchangeGroups(filters),
    create: (rows) => service.createExchangeGroups(rows),
    update: (rows) => service.updateExchangeGroups(rows),
    delete: (ids) => service.deleteExchangeGroups(ids),
  }),
  (current, next: CMLGroup) =>
    current && current.name === next.name && current.parent_external_id === next.parent_external_id
      ? null
      : { name: next.name, parent_external_id: next.parent_external_id },
  (current) => ({ name: current.name, parent_external_id: current.parent_external_id }),
);
