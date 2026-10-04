/** Изменяемые реквизиты сети: только переданные поля, `null` — очистить. */
export type UpdateNetworkSettingsCommand = {
  name?: string | null;
  legal_name?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  kpp?: string | null;
  legal_address?: string | null;
  phone?: string | null;
  email?: string | null;
};
