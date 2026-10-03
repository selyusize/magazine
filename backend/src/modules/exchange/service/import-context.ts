import type { FileLogger } from "@shared/service/logger/logger";

import type { CMLPriceType } from "./commerceml/types";
import type { ExchangeSettings } from "./exchange-settings";
import type { GroupMapping, PropertyMapping } from "./imported-product";
import type { ImportRunProgress } from "./import-run-progress";

/** Всё, что знает обработка одного запуска: кто, откуда, с какими настройками, и куда писать ход и лог. */
export type ImportContext = {
  run_id: string;
  supplier_id: string;
  package_dir: string;
  /** Начало запуска (ISO): метка предложений, по ней полная выгрузка обнуляет пропавшие. */
  synced_at: string;
  settings: ExchangeSettings;
  /** Типы цен из пакета — приходят перед предложениями. */
  price_types: CMLPriceType[];
  /** Свойства и группы поставщика с маппингом — перечитываются после сохранения классификатора. */
  properties: Map<string, PropertyMapping>;
  groups: Map<string, GroupMapping>;
  progress: ImportRunProgress;
  log: FileLogger;
};
