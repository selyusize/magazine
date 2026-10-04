import { textOrNull } from "@shared/query/narrow";

/** Поля реквизитов сети — порядок формы админки и полей Query. */
export const NETWORK_SETTINGS_FIELDS = [
  "name",
  "legal_name",
  "inn",
  "ogrn",
  "kpp",
  "legal_address",
  "phone",
  "email",
] as const;

export type NetworkSettingsValues = Record<
  (typeof NETWORK_SETTINGS_FIELDS)[number],
  string | null
>;

/** Строка таблицы (или её отсутствие) → значения реквизитов; чего нет — `null`. */
export const toNetworkSettingsValues = (
  row: Record<string, unknown> | undefined,
): NetworkSettingsValues => ({
  name: textOrNull(row?.name),
  legal_name: textOrNull(row?.legal_name),
  inn: textOrNull(row?.inn),
  ogrn: textOrNull(row?.ogrn),
  kpp: textOrNull(row?.kpp),
  legal_address: textOrNull(row?.legal_address),
  phone: textOrNull(row?.phone),
  email: textOrNull(row?.email),
});
