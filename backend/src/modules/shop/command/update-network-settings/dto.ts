/** Реквизиты сети после изменения — форма админки показывает их сразу. */
export type UpdatedNetworkSettingsDTO = {
  name: string | null;
  legal_name: string | null;
  inn: string | null;
  ogrn: string | null;
  kpp: string | null;
  legal_address: string | null;
  phone: string | null;
  email: string | null;
};
