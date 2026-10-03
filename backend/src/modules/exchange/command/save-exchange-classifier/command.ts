import type { CMLGroup, CMLProperty } from "../../service/commerceml/types";

/** Классификатор поставщика из `import.xml`: группы и свойства. Маппинг, заданный в админке, сохраняется. */
export type SaveExchangeClassifierCommand = {
  supplier_id: string;
  groups: CMLGroup[];
  properties: CMLProperty[];
};
