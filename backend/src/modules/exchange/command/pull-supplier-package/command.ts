/** Забрать выгрузку поставщика по ссылкам из настроек: по расписанию (`pull`) или кнопкой в админке (`manual`). */
export type PullSupplierPackageCommand = {
  supplier_id: string;
  source: "pull" | "manual";
};
